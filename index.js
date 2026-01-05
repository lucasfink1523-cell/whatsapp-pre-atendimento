require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const sessions = {}; // controle simples de estado

// Função para enviar mensagem
async function sendMessage(phone, message) {
  await axios.post(process.env.WHATSAPP_API_URL, {
    phone: phone,
    message: message
  });
}

// Webhook principal
app.post('/webhook', async (req, res) => {
  const phone = req.body.phone;
  const text = req.body.text?.trim();

  if (!phone || !text) {
    return res.sendStatus(200);
  }

  // Se não existe sessão, envia menu
  if (!sessions[phone]) {
    sessions[phone] = { step: 'menu' };

    await sendMessage(phone,
`Olá! 👋
Seja bem-vindo(a) ao *Fink Advocacia*.

Este é um canal de *pré-atendimento automático*, sem prestação de consulta jurídica.

Escolha uma opção:
1️⃣ Direito Bancário
2️⃣ Direito do Consumidor
3️⃣ Falar com um advogado`
    );

    return res.sendStatus(200);
  }

  // MENU
  if (sessions[phone].step === 'menu') {

    if (text === '1') {
      sessions[phone].step = 'bancario';

      await sendMessage(phone,
`Certo.

Para fins de pré-atendimento, informe brevemente:
• Banco ou instituição financeira
• Tipo de problema (ex.: golpe do PIX, conta bloqueada, juros abusivos)

⚠️ As informações serão analisadas posteriormente por um advogado.`
      );

    } else if (text === '2') {
      sessions[phone].step = 'consumidor';

      await sendMessage(phone,
`Entendido.

Para fins de pré-atendimento, informe brevemente:
• Empresa ou fornecedor
• Descrição resumida do problema

⚠️ As informações serão analisadas posteriormente por um advogado.`
      );

    } else if (text === '3') {
      delete sessions[phone];

      await sendMessage(phone,
`Perfeito.

Sua mensagem será encaminhada para atendimento humano.
⏳ O retorno ocorrerá conforme disponibilidade da equipe.`
      );

    } else {
      await sendMessage(phone, 'Por favor, responda com 1, 2 ou 3.');
    }

    return res.sendStatus(200);
  }

  // FINALIZAÇÃO (após resposta do cliente)
  if (sessions[phone].step === 'bancario' || sessions[phone].step === 'consumidor') {

    delete sessions[phone];

    await sendMessage(phone,
`Obrigado pelas informações.

Um advogado irá analisar o caso e entrará em contato, caso seja possível o atendimento.

⚖️ Este canal não substitui consulta jurídica.`
    );

    return res.sendStatus(200);
  }

  res.sendStatus(200);
});

// Start
app.listen(process.env.PORT, () => {
  console.log(`🚀 API rodando na porta ${process.env.PORT}`);
});
