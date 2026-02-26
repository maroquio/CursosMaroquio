import { Container, Title, Text, Stack, Box, Divider, Anchor } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useThemedStyles } from '../hooks';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Stack gap="sm">
      <Title order={3} style={{ fontFamily: '"Outfit", sans-serif' }}>
        {title}
      </Title>
      {children}
    </Stack>
  );
}

export function TermsOfUse() {
  const { isDark, theme } = useThemedStyles();
  const isMobile = useMediaQuery('(max-width: 480px)');

  return (
    <Box
      style={{
        background: isDark
          ? `linear-gradient(135deg, ${theme.colors.slate[9]} 0%, ${theme.colors.indigo[9]} 100%)`
          : `linear-gradient(135deg, ${theme.colors.slate[0]} 0%, ${theme.colors.indigo[0]} 100%)`,
        minHeight: 'calc(100vh - 60px)',
      }}
    >
      <Container size="md" py="xl" px={isMobile ? 'md' : 'xl'}>
        <Stack gap="xl">
          <Stack gap="xs">
            <Title
              order={1}
              style={{ fontFamily: '"Outfit", sans-serif', fontSize: isMobile ? '1.6rem' : '2rem' }}
            >
              Termos de Uso
            </Title>
            <Text size="sm" c="dimmed">
              Última atualização: fevereiro de 2026
            </Text>
          </Stack>

          <Text c="dimmed" style={{ lineHeight: 1.8 }}>
            Bem-vindo à <strong>Maroquio.com</strong>. Ao acessar ou utilizar esta plataforma, você
            concorda com os presentes Termos de Uso. Leia-os com atenção antes de se cadastrar ou
            adquirir qualquer curso. Caso não concorde com alguma condição, não utilize a plataforma.
          </Text>

          <Divider />

          <Section title="1. A Plataforma">
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              A <strong>Maroquio.com</strong> é uma plataforma de ensino a distância (EAD) que
              oferece cursos online nas áreas de programação e desenvolvimento de software, sob
              responsabilidade do <strong>Prof. Ricardo Maroquio</strong>. O acesso aos cursos é
              realizado por meio de aulas interativas disponíveis neste endereço eletrônico.
            </Text>
          </Section>

          <Divider />

          <Section title="2. Cadastro e Conta">
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              Para utilizar os recursos da plataforma, é necessário criar uma conta com informações
              verdadeiras, completas e atualizadas. O usuário é responsável pela confidencialidade
              de sua senha e por todas as atividades realizadas em sua conta.
            </Text>
            <Stack gap="xs" pl="md">
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• É proibido criar múltiplas contas para um mesmo indivíduo;</Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• É proibido compartilhar credenciais de acesso com terceiros;</Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• O usuário deve notificar imediatamente qualquer uso não autorizado de sua conta pelo e-mail <Anchor href="mailto:contato@maroquio.com" size="sm">contato@maroquio.com</Anchor>.</Text>
            </Stack>
          </Section>

          <Divider />

          <Section title="3. Cursos e Acesso ao Conteúdo">
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              A plataforma oferece cursos <strong>gratuitos</strong> e{' '}
              <strong>pagos</strong>. Para cursos gratuitos, o acesso é liberado imediatamente após
              o cadastro e matrícula. Para cursos pagos, o acesso é liberado após a confirmação do
              pagamento.
            </Text>
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              A licença de acesso ao conteúdo dos cursos é <strong>pessoal, intransferível e
              não exclusiva</strong>, destinada exclusivamente ao uso educacional do aluno
              matriculado. O conteúdo não pode ser reproduzido, distribuído ou repassado a terceiros
              de nenhuma forma.
            </Text>
          </Section>

          <Divider />

          <Section title="4. Preços e Pagamentos">
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              Os preços dos cursos pagos estão expressos em reais (BRL) e incluem todos os tributos
              aplicáveis. O pagamento é processado por plataformas de pagamento parceiras. A
              confirmação da matrícula está condicionada à aprovação do pagamento pelo processador.
            </Text>
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              Os preços podem ser alterados a qualquer momento. Alterações de preço não afetam
              cursos já adquiridos.
            </Text>
          </Section>

          <Divider />

          <Section title="5. Direito de Arrependimento (CDC Art. 49)">
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              Em conformidade com o art. 49 do{' '}
              <strong>Código de Defesa do Consumidor (Lei nº 8.078/1990)</strong> e o Decreto nº
              7.962/2013 (Marco do Comércio Eletrônico), o consumidor tem o direito de{' '}
              <strong>
                desistir da compra de qualquer curso pago, sem necessidade de justificativa, no
                prazo de 7 (sete) dias corridos
              </strong>{' '}
              contados da data da confirmação do pagamento.
            </Text>
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              <strong>Como exercer o direito de arrependimento:</strong>
            </Text>
            <Stack gap="xs" pl="md">
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>
                1. Envie um e-mail para{' '}
                <Anchor href="mailto:contato@maroquio.com">contato@maroquio.com</Anchor>{' '}
                com o assunto <strong>"Arrependimento de Compra"</strong>;
              </Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>
                2. Informe o nome do curso adquirido, o e-mail da sua conta e a data da compra;
              </Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>
                3. A solicitação pode ser enviada a qualquer momento durante os 7 dias corridos
                após o pagamento, inclusive fora do horário comercial.
              </Text>
            </Stack>
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              O reembolso será realizado de forma <strong>integral</strong>, sem descontos ou
              cobranças adicionais. O prazo para estorno depende do meio de pagamento utilizado —
              para cartão de crédito, o estorno é solicitado imediatamente, mas pode levar até 2
              faturas para aparecer na fatura do cartão.
            </Text>
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              Após o reembolso processado, o acesso ao curso será encerrado.
            </Text>
          </Section>

          <Divider />

          <Section title="6. Propriedade Intelectual">
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              Todo o conteúdo disponível na plataforma — incluindo textos, vídeos, imagens, códigos,
              exercícios e materiais didáticos — é de propriedade exclusiva do{' '}
              <strong>Prof. Ricardo Maroquio</strong> ou de seus licenciadores, protegidos pela{' '}
              <strong>Lei de Direitos Autorais (Lei nº 9.610/1998)</strong>.
            </Text>
            <Stack gap="xs" pl="md">
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• É proibida a reprodução, cópia, distribuição ou transmissão do conteúdo sem autorização expressa e prévia;</Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• É proibida a criação de obras derivadas com base no conteúdo dos cursos para fins comerciais;</Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• É proibida a gravação, captura de tela ou download não autorizado de vídeos e materiais.</Text>
            </Stack>
          </Section>

          <Divider />

          <Section title="7. Conduta do Usuário">
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              O usuário concorda em não utilizar a plataforma para:
            </Text>
            <Stack gap="xs" pl="md">
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• Violar qualquer lei ou regulamento aplicável;</Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• Tentar acessar, de forma não autorizada, contas de outros usuários ou sistemas da plataforma;</Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• Enviar, publicar ou transmitir conteúdo ofensivo, difamatório, fraudulento ou que viole direitos de terceiros;</Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• Utilizar ferramentas automatizadas para raspar ou extrair dados da plataforma.</Text>
            </Stack>
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              A violação dessas regras pode resultar na suspensão ou cancelamento da conta, sem
              prejuízo das medidas legais cabíveis.
            </Text>
          </Section>

          <Divider />

          <Section title="8. Limitação de Responsabilidade">
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              A plataforma é fornecida "no estado em que se encontra". Envidamos todos os esforços
              razoáveis para garantir a disponibilidade e qualidade do serviço, mas não garantimos
              que o acesso será ininterrupto, livre de erros ou que os resultados obtidos com os
              cursos atenderão a expectativas específicas.
            </Text>
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              Não nos responsabilizamos por danos indiretos, incidentais ou consequentes decorrentes
              do uso ou impossibilidade de uso da plataforma, salvo nos casos previstos em lei,
              em especial nas normas do Código de Defesa do Consumidor.
            </Text>
          </Section>

          <Divider />

          <Section title="9. Modificações dos Termos">
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              Podemos revisar estes Termos de Uso periodicamente. A versão vigente é sempre
              identificada pela data de atualização no início do documento. O uso continuado da
              plataforma após a publicação de alterações implica aceitação dos novos termos.
              Alterações materiais serão comunicadas por e-mail com antecedência mínima de 10 dias.
            </Text>
          </Section>

          <Divider />

          <Section title="10. Legislação Aplicável e Foro">
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              Estes Termos de Uso são regidos pela legislação brasileira, em especial:
            </Text>
            <Stack gap="xs" pl="md">
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• Código de Defesa do Consumidor (Lei nº 8.078/1990);</Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• Marco Civil da Internet (Lei nº 12.965/2014);</Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018);</Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• Lei de Direitos Autorais (Lei nº 9.610/1998).</Text>
            </Stack>
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              Fica eleito o foro da comarca do domicílio do consumidor para resolução de quaisquer
              conflitos decorrentes destes Termos, salvo disposição legal em contrário.
            </Text>
          </Section>

          <Divider />

          <Section title="11. Contato">
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              Para dúvidas, sugestões ou reclamações relacionadas a estes Termos de Uso, entre em
              contato pelo e-mail{' '}
              <Anchor href="mailto:contato@maroquio.com">contato@maroquio.com</Anchor>.
            </Text>
          </Section>
        </Stack>
      </Container>
    </Box>
  );
}
