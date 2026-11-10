/** Registracijo lahko ugasneš (REGISTRATION_OPEN=false) ali zaščitiš z vabilno kodo (INVITE_CODE). */
export const registrationOpen = () => process.env.REGISTRATION_OPEN !== "false";
export const inviteCode = () => process.env.INVITE_CODE?.trim() || null;
