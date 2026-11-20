
import express, {
  type ErrorRequestHandler
} from "express";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import {loadCourseContexts, buildCourseInstruction} from './course-context.js';
import {LearningSchema, loadModule1Content, module1Instruction} from './module1-context.js';
import {loadModuleLibrary, libraryInstruction} from './module1-library.js';

// ========================================
// CONFIGURACIÓN
// ========================================

const app = express();
const PORT = Number(process.env.PORT || 3001);

app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));

const apiKey = process.env.GEMINI_API_KEY;
const internalToken = process.env.INTERNAL_API_TOKEN;
const model =
  process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

if (!apiKey || !internalToken) {
  throw new Error(
    "Faltan GEMINI_API_KEY o INTERNAL_API_TOKEN"
  );
}

const ai = new GoogleGenAI({ apiKey });
const courseContexts = loadCourseContexts(process.env.COURSE_CONTEXT_BINDINGS_FILE);
const module1Content = loadModule1Content(process.env.MODULE1_CONTENT_FILE);
const module1Library = loadModuleLibrary();

// ========================================
// CONFIGURACIÓN DEL TUTOR
// ========================================

const SYSTEM_INSTRUCTION = `
Eres el Tutor IA de Gestión22 Capacitación.

Tu función es ayudar a estudiantes a comprender
y aplicar los contenidos académicos.

REGLAS:

1. Responde siempre en español claro y profesional.

2. Explica conceptos de forma sencilla y educativa.

3. Cuando el estudiante tenga dificultades,
   ofrece ejemplos y explicaciones paso a paso.

4. Puedes proponer ejercicios y casos prácticos
   para reforzar el aprendizaje.

5. Antes de un quiz, ayuda al estudiante
   a comprender los conceptos sin proporcionar
   respuestas de evaluaciones oficiales.

6. Si una pregunta es demasiado compleja
   o requiere criterio profesional,
   recomienda consultar al tutor humano.

7. No inventes referencias académicas.

8. Consulta únicamente los contenidos y extractos documentales
   adjuntos a esta solicitud. No afirmes tener acceso a otros archivos.

9. No proporciones decisiones clínicas para
   pacientes reales ni sustituyas la evaluación
   de profesionales sanitarios.

10. Mantén un tono cercano, respetuoso
    y orientado al aprendizaje.
`;

// ========================================
// VALIDACIÓN DE PREGUNTAS
// ========================================

const QuestionSchema = z.object({
  courseId: z.number().int().positive(),
  question: z.string().trim().min(3).max(2000),
  activityId: z.string().optional(), concept: z.string().optional(), module1Allowed: z.boolean().default(false)
}).refine(value => LearningSchema.safeParse(value).success, {message: 'Invalid learning activity'});

// ========================================
// REINTENTOS AUTOMÁTICOS DE GEMINI
// ========================================

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

function getErrorStatus(error: unknown): number | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    return error.status;
  }

  if (error instanceof Error) {
    const match = error.message.match(
      /"code"\s*:\s*(429|503)/
    );

    if (match) {
      return Number(match[1]);
    }

    const prefix = error.message.match(
      /^(429|503)\b/
    );

    if (prefix) {
      return Number(prefix[1]);
    }
  }

  return undefined;
}

async function consultarGemini(question: string, courseId: number, activityId?: string, module1Allowed = false) {
  const context = courseContexts.get(courseId);
  const systemInstruction = SYSTEM_INSTRUCTION + buildCourseInstruction(context) +
    (module1Allowed ? module1Instruction(module1Content, context?.id, activityId) +
    libraryInstruction(module1Library, context?.id, question) : '');
  const maxIntentos = 3;

  for (let intento = 1; intento <= maxIntentos; intento++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: question,
        config: {
          systemInstruction,
          maxOutputTokens: 1000,
          temperature: 0.4
        }
      });

      return response;

    } catch (error) {
      const status = getErrorStatus(error);
      const temporal = status === 429 || status === 503;

      if (!temporal || intento === maxIntentos) {
        throw error;
      }

      const espera = 2000 * 2 ** (intento - 1);

      console.warn(
        `[Gestión22] Gemini devolvió ${status}. ` +
        `Reintento ${intento + 1}/${maxIntentos} ` +
        `en ${espera / 1000} segundos`
      );

      await sleep(espera);
    }
  }

  throw new Error("No fue posible consultar Gemini");
}

// ========================================
// VERIFICACIÓN DEL SERVIDOR
// ========================================

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "gestion22-ai",
    version: "0.3.0"
  });
});

// ========================================
// CHAT CON GOOGLE GEMINI
// ========================================

app.post("/api/chat", async (req, res) => {
  // Autenticación entre Moodle y backend.
  const providedToken = req.header("x-internal-token");

  if (!providedToken || providedToken !== internalToken) {
    res.status(401).json({
      success: false,
      error: "No autorizado"
    });
    return;
  }

  // Validación de los datos recibidos.
  const parsed = QuestionSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: "Solicitud inválida"
    });
    return;
  }

  const { courseId, question, activityId, module1Allowed } = parsed.data;

  try {
    console.log(
      `[Gestión22] Consulta recibida para curso ${courseId}`
    );

    // Consulta con reintentos automáticos.
    const response = await consultarGemini(question, courseId, activityId, module1Allowed);

    const answer = response.text?.trim();

    if (!answer) {
      res.status(502).json({
        success: false,
        error: "Gemini no devolvió una respuesta"
      });
      return;
    }

    console.log(
      `[Gestión22] Respuesta generada para curso ${courseId}`
    );

    res.json({
      success: true,
      courseId,
      answer,
      sources: [],
      grounded: false,
      needsHumanTutor: false
    });

  } catch (error) {
    const status = getErrorStatus(error);

    if (error instanceof Error) {
      console.error(
        "[Gestión22] Error Gemini:",
        error.message
      );
    } else {
      console.error(
        "[Gestión22] Error desconocido al consultar Gemini"
      );
    }

    // Saturación o límite temporal del proveedor.
    if (status === 503 || status === 429) {
      res.status(503).json({
        success: false,
        error:
          "El tutor IA está temporalmente ocupado. " +
          "Intenta nuevamente en unos minutos.",
        retryable: true
      });
      return;
    }

    res.status(502).json({
      success: false,
      error: "No fue posible consultar el modelo de IA"
    });
  }
});

// ========================================
// MANEJO DE ERRORES
// ========================================

const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next
) => {
  console.error(
    "[Gestión22] Error procesando solicitud:",
    error instanceof Error ? error.message : "Error desconocido"
  );

  res.status(400).json({
    success: false,
    error: "Solicitud inválida"
  });
};

app.use(errorHandler);

// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(PORT, "0.0.0.0", () => {
  console.log("=================================");
  console.log(" Gestión22 Tutor IA - Backend");
  console.log(` Puerto: ${PORT}`);
  console.log(` Modelo: ${model}`);
  console.log(" Estado: Servidor iniciado");
  console.log(" Reintentos Gemini: habilitados");
  console.log("=================================");
});
