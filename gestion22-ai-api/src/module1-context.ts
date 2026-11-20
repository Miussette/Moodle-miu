import {readFileSync} from 'node:fs';
import {z} from 'zod';
const ActivitySchema = z.enum(['anatomy', 'risks', 'assessment', 'checklist', 'case', 'practice']);
const ContentSchema = z.object({schemaVersion: z.literal(1), contextId: z.string().min(1), source: z.string(),
  tutorContexts: z.record(ActivitySchema, z.array(z.string().min(1)))}).passthrough();
export const LearningSchema = z.object({activityId: ActivitySchema.optional(), concept: ActivitySchema.optional()})
  .refine(value => value.activityId === value.concept, {message: 'Activity and concept must match'});
export type ModuleContent = z.infer<typeof ContentSchema>;
export function loadModule1Content(filename: string | undefined): ModuleContent | undefined {
  if (!filename) return undefined;
  const value: unknown = JSON.parse(readFileSync(filename, 'utf8'));
  return ContentSchema.parse(value);
}
export function module1Instruction(content: ModuleContent | undefined, courseContextId: string | undefined,
  activityId: string | undefined): string {
  if (!content || content.contextId !== courseContextId || (activityId && !ActivitySchema.safeParse(activityId).success)) {
    return '\nNo hay contenido verificado de esta actividad para este curso. No inventes su contenido ni decisiones clínicas.';
  }
  const selected = activityId ? ActivitySchema.parse(activityId) : undefined;
  return '\nCONTENIDO COMPLETO DEL MÓDULO 1. Actividad actual: ' + (selected ?? 'consulta general') +
    '\n' + JSON.stringify(content) +
    '\nOrganización: Videos módulo I, Infografías, Ejercicios prácticos, Material complementario. ' +
    'Videos: se requiere reproducir el 80% de tramos únicos, sin confirmación manual; progreso local al navegador. ' +
    'Infografías: Anatomía de la piel; Checklist de evaluación de la piel; Prevención desde el ingreso del paciente; Tabla resumen de factores que afectan la integridad cutánea. ' +
    (selected ? '\nRepaso de la actividad: ' + JSON.stringify(content.tutorContexts[selected]) : '') +
    '\nUsa estos contenidos para orientar el repaso. Solo puedes atribuir contenido de PDF a los extractos documentales adjuntos. No afirmes haber visto los videos. No solicites ni repitas datos de pacientes reales. ' +
    'No sustituyas el criterio profesional. No inventes la respuesta correcta del caso: sus decisiones son predefinidas. ' +
    'No entregues soluciones de evaluaciones oficiales; guía con preguntas y ejemplos ficticios. Mantén grounded=false.';
}
