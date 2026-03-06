# Ideal do app

A ideia é basicamente unir idosos a cuidadores, médicos, familiares, etc.

O app conta, então, com 4 entidades básicas:
1. Idoso
2. Familiar(es)
3. Médico(s)
4. Cuidador(es)

Além disso, o aplicativo apresentará funcionalidades referentes aos seguintes domínios:
1. Medicações
2. Consultas
3. Procedimentos
4. Metas (ex. exercícios, sono, ...)

Por fim, o app irá conter e apresentar informações úteis sobre assuntos, em uma 'pasta de artigos' (algo como um blog).

### Para o idoso

O app deve:
- Lembrar o idoso de remédios no dia
- Lembrar o idoso de responsabilidades da semana (ex. consultas)
- Registrar quando o idoso toma o remédio
- Registrar quando o idoso cumpre uma responsabilidade da semana
- Permitir que o idoso consulte um relatório de remédios e responsabilidades futuras, cumpridas e atrasadas
- Modo "Ajuda" - botão grande para ligar para familiar/cuidador

### Para o familiar (chamaremos de responsáveis)

O app deve:
- Permitir que o familiar crie sua conta e cadastre o idoso e outros familiares
  - Ex. Eu crio minha conta. Crio o acesso para o idoso que quero cuidar, e permito outros familiares a acessarem a mesma 'rede'.
  - A ideia é fazer associações entre idoso - familiar - cuidador - médico
- Permitir que o familiar consulte o relatório do idoso
- Notificações quando idoso NÃO toma medicação no horário
- Notificações de eventos importantes (consulta hoje, medicação atrasada)
- Histórico de quem fez cada ação (auditoria)
- Permissões granulares (familiar A pode editar, familiar B só visualiza)

Para os seguintes, verificar se é válido:
- Permitir que o familiar insira orientações para o idoso 
- Permitir que o familiar gerencie Medicações, consultas, procedimentos, metas (gerenciar: Criar, editar, apagar)

Além disso, o familiar deve ser responsável por cuidar:
- Permitir que o cuidador crie sua conta e associe um ou mais idosos
- Permitir que o cuidador acesse a página de gestão de cada idoso
- Permitir que o cuidador insira orientações para o idoso
- Permitir que o cuidador faça a gestão de medicações, consultas, procedimentos, metas
- Checklist diário (tarefas além de medicação: banho, alimentação, exercícios)
- Registro de ocorrências (quedas, mal-estar, recusas)

### Em resumo:
Cuidador > Familiar na gestão OPERACIONAL do dia a dia
Familiar > Cuidador em decisões ESTRATÉGICAS (trocar cuidador, cancelar medicação)


# Ideias a mais:

- Convites por email/whatsapp para outros familiares
- Divisão de custos (rachar gastos de medicamentos/consultas)
- Agenda compartilhada (quem vai levar na consulta)
- Notas/observações sobre o idoso (ex: "hoje estava confuso")
- Timeline de eventos (linha do tempo visual)
- Modo profissional: estatísticas de todos os idosos gerenciados
- Scan de receitas médicas via câmera
- Registro de horário de entrada/saída (para cuidadores pagos)
- Notificações de fim de estoque de medicamentos
- Upload de receitas/prescrições (PDF/imagem)
- OCR para digitalizar receitas automaticamente
- Histórico de medicações anteriores (o que já tentou)
- Gráficos de evolução (glicose, pressão ao longo do tempo)
- Exportar relatório completo em PDF
- Adesão do paciente ao tratamento (% de medicações tomadas)
- Alertas de NÃO adesão (paciente não está tomando remédios)
- Integração com outros médicos (ver o que cardiologista prescreveu)
- Notas médicas privadas (não visíveis para família)

### Dashboard do médico deve mostrar:
- Idosos com consulta esta semana
- Idosos com baixa adesão (<80%)
- Idosos que precisam renovar receita
- Medicações próximas de acabar
- Exames pendentes
- Interações medicamentosas detectadas

