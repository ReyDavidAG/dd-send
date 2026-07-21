// Máximo de borradores por usuario mientras el MVP no cobra (protección al publicar).
// En módulo aparte porque los archivos "use server" solo exportan funciones async.
export const MAX_DRAFTS = 2;

// Fotos: registros (subidas) por usuario y cuántas se muestran en una invitación.
export const MAX_LIBRARY = 6;
export const MAX_SELECTED = 3;
