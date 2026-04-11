const prisma = require('../config/prisma');

const canRecordIntake = async (req, res, next) => {
  try {
    const { id: medicationId } = req.params;
    const userId = req.user.id;

    // 1. Find the medication to get its networkId
    const medication = await prisma.medication.findUnique({
      where: { id: medicationId },
      select: { networkId: true }
    });

    if (!medication) {
      return res.status(404).json({ error: 'Medicamento não encontrado' });
    }

    // 2. Find the user's membership in that network
    const member = await prisma.networkMember.findUnique({
      where: { userId_networkId: { userId, networkId: medication.networkId } },
    });

    if (!member) {
      return res.status(403).json({ error: 'Você não faz parte desta rede de apoio' });
    }

    req.membership = member;

    // 3. Rule: Can record if medicationAccess === 'EDIT' OR role === 'ASSISTIDO'
    const canEdit = member.medicationAccess === 'EDIT';
    const isAssistido = member.role === 'ASSISTIDO';

    if (!canEdit && !isAssistido) {
      return res.status(403).json({ error: 'Você não tem permissão para registrar a ingestão deste medicamento' });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = canRecordIntake;
