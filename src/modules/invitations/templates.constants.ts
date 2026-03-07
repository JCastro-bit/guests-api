export type TemplateStyle = 'romantico' | 'moderno' | 'rustico' | 'minimalista';
export type TemplatePlan = 'free' | 'esencial' | 'premium';
export type ColorPalette = 'clasico' | 'warm' | 'minimal';

export interface Template {
  id: string;
  name: string;
  plan: TemplatePlan;
  style: TemplateStyle;
  previewUrl: string;
  defaultColorPalette: ColorPalette;
}

export const COLOR_PALETTES: Record<ColorPalette, { primary: string; background: string; text: string }> = {
  clasico: { primary: '#2D1B0E', background: '#FAF0E6', text: '#2D1B0E' },
  warm: { primary: '#D4714E', background: '#F5E6D3', text: '#2D1B0E' },
  minimal: { primary: '#555555', background: '#FFFFFF', text: '#333333' },
};

export const INVITATION_TEXTS: Record<TemplateStyle, string> = {
  romantico: 'Junto con sus familias, {{coupleName}} tienen el honor de invitarles a celebrar su matrimonio el {{eventDate}}{{venueText}}.',
  moderno: '¡Nos casamos! {{coupleName}} los invitan a ser parte de su día más especial el {{eventDate}}{{venueText}}.',
  rustico: 'Con mucho amor, {{coupleName}} los invitan a acompañarlos en su boda el {{eventDate}}{{venueText}}.',
  minimalista: '{{coupleName}} · {{eventDate}}{{venueText}}.',
};

export const TEMPLATES: Template[] = [
  { id: 'free-clasico', name: 'Clásico', plan: 'free', style: 'romantico', previewUrl: '/templates/free-clasico.jpg', defaultColorPalette: 'clasico' },
  { id: 'esencial-romantico-01', name: 'Rosa Antiguo', plan: 'esencial', style: 'romantico', previewUrl: '/templates/esencial-romantico-01.jpg', defaultColorPalette: 'warm' },
  { id: 'esencial-moderno-01', name: 'Línea Fina', plan: 'esencial', style: 'moderno', previewUrl: '/templates/esencial-moderno-01.jpg', defaultColorPalette: 'minimal' },
  { id: 'esencial-rustico-01', name: 'Tierra Cálida', plan: 'esencial', style: 'rustico', previewUrl: '/templates/esencial-rustico-01.jpg', defaultColorPalette: 'warm' },
  { id: 'esencial-minimal-01', name: 'Blanco Puro', plan: 'esencial', style: 'minimalista', previewUrl: '/templates/esencial-minimal-01.jpg', defaultColorPalette: 'minimal' },
];

export function getTemplatesForPlan(plan: TemplatePlan): Template[] {
  if (plan === 'free') {
    return TEMPLATES.filter((t) => t.plan === 'free');
  }
  return TEMPLATES;
}

export function generateInvitationText(
  style: TemplateStyle,
  coupleName: string,
  eventDate?: string,
  venue?: string,
): string {
  const venueText = venue ? ` en ${venue}` : '';
  const dateText = eventDate ?? 'fecha por confirmar';
  return INVITATION_TEXTS[style]
    .replace('{{coupleName}}', coupleName)
    .replace('{{eventDate}}', dateText)
    .replace('{{venueText}}', venueText);
}
