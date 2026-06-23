const { z } = require('zod');

const createInvitationSchema = z.object({
  invitedEmail: z.string().email('Email inválido').optional(),
  invitedPhone: z.string().optional(),
  proposedRole: z.enum(['RESPONSAVEL', 'ASSISTIDO']),
  medicationAccess: z.enum(['NONE', 'VIEW', 'EDIT']).default('NONE'),
  consultationAccess: z.enum(['NONE', 'VIEW', 'EDIT']).default('NONE'),
  networkAccess: z.enum(['NONE', 'VIEW', 'EDIT']).default('NONE'),
  recordsAccess: z.enum(['NONE', 'VIEW', 'EDIT']).default('NONE'),
}).refine(data => data.invitedEmail || data.invitedPhone, {
  message: 'É necessário fornecer pelo menos um email ou telefone para o convite',
  path: ['invitedEmail'],
}).transform((data) => {
  if (data.proposedRole !== 'ASSISTIDO') return data;
  return {
    ...data,
    medicationAccess:   data.medicationAccess   !== 'NONE' ? data.medicationAccess   : 'VIEW',
    consultationAccess: data.consultationAccess !== 'NONE' ? data.consultationAccess : 'VIEW',
    networkAccess:      data.networkAccess,
    recordsAccess:      data.recordsAccess      !== 'NONE' ? data.recordsAccess      : 'VIEW',
  };
});

module.exports = {
  createInvitationSchema,
};
