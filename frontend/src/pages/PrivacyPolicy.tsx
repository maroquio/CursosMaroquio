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

export function PrivacyPolicy() {
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
              Política de Privacidade
            </Title>
            <Text size="sm" c="dimmed">
              Última atualização: fevereiro de 2026
            </Text>
          </Stack>

          <Text c="dimmed" style={{ lineHeight: 1.8 }}>
            A sua privacidade é importante para nós. Esta Política de Privacidade descreve como
            a <strong>Maroquio.com</strong> coleta, utiliza, armazena e protege os seus dados
            pessoais, em conformidade com a{' '}
            <strong>Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018)</strong> e
            demais normas aplicáveis.
          </Text>

          <Divider />

          <Section title="1. Identificação do Controlador">
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              O <strong>controlador</strong> dos seus dados pessoais, nos termos do art. 5º, VI, da
              LGPD, é:
            </Text>
            <Stack gap="xs" pl="md">
              <Text c="dimmed"><strong>Nome:</strong> Prof. Ricardo Maroquio</Text>
              <Text c="dimmed"><strong>Plataforma:</strong> Maroquio.com</Text>
              <Text c="dimmed">
                <strong>E-mail de contato:</strong>{' '}
                <Anchor href="mailto:contato@maroquio.com" size="sm">
                  contato@maroquio.com
                </Anchor>
              </Text>
            </Stack>
          </Section>

          <Divider />

          <Section title="2. Dados Pessoais Coletados">
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              Coletamos apenas os dados estritamente necessários para a prestação dos nossos
              serviços:
            </Text>
            <Stack gap="xs" pl="md">
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>
                <strong>Dados de cadastro:</strong> nome completo, endereço de e-mail, número de
                telefone e senha (armazenada com hash criptográfico).
              </Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>
                <strong>Dados de uso:</strong> progresso nas aulas, histórico de acesso, aulas
                concluídas e tempo de estudo.
              </Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>
                <strong>Dados de autenticação:</strong> tokens de sessão (JWT) com validade
                limitada, e dados de login social (Google/GitHub) quando utilizados.
              </Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>
                <strong>Dados de pagamento:</strong> para cursos pagos, os dados financeiros são
                processados diretamente por plataformas de pagamento externas (ex.: Stripe, Mercado
                Pago). <strong>Não armazenamos dados de cartão de crédito.</strong>
              </Text>
            </Stack>
          </Section>

          <Divider />

          <Section title="3. Finalidades do Tratamento">
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              Seus dados são utilizados para as seguintes finalidades (art. 9º, I, LGPD):
            </Text>
            <Stack gap="xs" pl="md">
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• Criar e gerenciar a sua conta na plataforma;</Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• Autenticar o acesso e garantir a segurança da conta;</Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• Registrar e exibir o progresso nas aulas e módulos;</Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• Processar matrículas em cursos gratuitos e pagos;</Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• Emitir certificados de conclusão;</Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• Enviar comunicações relacionadas à sua conta e aos cursos adquiridos;</Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• Atender obrigações legais e regulatórias.</Text>
            </Stack>
          </Section>

          <Divider />

          <Section title="4. Base Legal para o Tratamento">
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              Tratamos seus dados com fundamento nas seguintes hipóteses previstas no art. 7º da LGPD:
            </Text>
            <Stack gap="xs" pl="md">
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>
                <strong>Execução de contrato (art. 7º, V):</strong> para fornecer o acesso aos
                cursos adquiridos e registrar o progresso do aluno.
              </Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>
                <strong>Consentimento (art. 7º, I):</strong> para o envio de comunicações de
                marketing e novidades da plataforma, podendo ser revogado a qualquer momento.
              </Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>
                <strong>Cumprimento de obrigação legal (art. 7º, II):</strong> para atender
                exigências fiscais, tributárias e regulatórias.
              </Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>
                <strong>Legítimo interesse (art. 7º, IX):</strong> para análises de segurança,
                prevenção de fraudes e melhoria dos serviços.
              </Text>
            </Stack>
          </Section>

          <Divider />

          <Section title="5. Compartilhamento de Dados">
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              Não vendemos, alugamos ou comercializamos seus dados pessoais. Podemos
              compartilhá-los apenas com:
            </Text>
            <Stack gap="xs" pl="md">
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>
                <strong>Processadores de pagamento:</strong> para viabilizar transações financeiras
                de cursos pagos, sujeitos às suas próprias políticas de privacidade.
              </Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>
                <strong>Provedores de infraestrutura:</strong> servidores e serviços de hospedagem
                necessários para o funcionamento da plataforma.
              </Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>
                <strong>Autoridades públicas:</strong> quando exigido por lei, decisão judicial ou
                requisição de autoridade competente.
              </Text>
            </Stack>
          </Section>

          <Divider />

          <Section title="6. Armazenamento e Segurança">
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              Seus dados são armazenados em servidores seguros no Brasil. Adotamos medidas técnicas
              e organizacionais para protegê-los, incluindo:
            </Text>
            <Stack gap="xs" pl="md">
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• Criptografia de senhas com algoritmos seguros (bcrypt);</Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• Comunicações via protocolo HTTPS/TLS;</Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• Tokens de autenticação com prazo de expiração curto;</Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• Controle de acesso com princípio do mínimo privilégio.</Text>
            </Stack>
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              Os dados são retidos pelo prazo necessário para a prestação do serviço e cumprimento
              de obrigações legais. Após a exclusão da conta, os dados são anonimizados ou
              eliminados, salvo quando a retenção for obrigatória por lei.
            </Text>
          </Section>

          <Divider />

          <Section title="7. Direitos do Titular (LGPD Art. 18)">
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              Como titular de dados pessoais, você tem os seguintes direitos, que podem ser
              exercidos mediante solicitação pelo e-mail{' '}
              <Anchor href="mailto:contato@maroquio.com" size="sm">
                contato@maroquio.com
              </Anchor>
              :
            </Text>
            <Stack gap="xs" pl="md">
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• <strong>Confirmação e acesso:</strong> saber se tratamos seus dados e obter uma cópia deles;</Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• <strong>Correção:</strong> solicitar a correção de dados incompletos, inexatos ou desatualizados;</Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• <strong>Anonimização, bloqueio ou eliminação:</strong> de dados desnecessários ou tratados em desconformidade com a LGPD;</Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• <strong>Portabilidade:</strong> receber seus dados em formato estruturado e interoperável;</Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• <strong>Revogação do consentimento:</strong> a qualquer momento, para os tratamentos baseados em consentimento;</Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• <strong>Oposição:</strong> ao tratamento realizado com fundamento em legítimo interesse;</Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• <strong>Eliminação:</strong> dos dados tratados com base no consentimento, quando solicitado.</Text>
            </Stack>
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              Responderemos às solicitações no prazo de até 15 dias corridos, conforme art. 18,
              §5º, da LGPD.
            </Text>
          </Section>

          <Divider />

          <Section title="8. Cookies e Tecnologias Similares">
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              Utilizamos cookies e armazenamento local (<em>localStorage</em>) para:
            </Text>
            <Stack gap="xs" pl="md">
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• Manter a sessão autenticada durante a navegação;</Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• Salvar preferências de idioma e tema (claro/escuro);</Text>
              <Text c="dimmed" style={{ lineHeight: 1.7 }}>• Lembrar o progresso nas aulas.</Text>
            </Stack>
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              Não utilizamos cookies de rastreamento para publicidade. Você pode limpar os dados
              armazenados pelo navegador a qualquer momento, mas isso encerrará a sua sessão.
            </Text>
          </Section>

          <Divider />

          <Section title="9. Encarregado de Dados (DPO)">
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              Nos termos do art. 41 da LGPD, o encarregado pelo tratamento de dados pessoais é:
            </Text>
            <Stack gap="xs" pl="md">
              <Text c="dimmed"><strong>Nome:</strong> Prof. Ricardo Maroquio</Text>
              <Text c="dimmed">
                <strong>E-mail:</strong>{' '}
                <Anchor href="mailto:contato@maroquio.com" size="sm">
                  contato@maroquio.com
                </Anchor>
              </Text>
            </Stack>
          </Section>

          <Divider />

          <Section title="10. Alterações nesta Política">
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              Podemos atualizar esta Política de Privacidade periodicamente para refletir mudanças
              em nossas práticas ou em exigências legais. A data da última atualização é sempre
              indicada no topo do documento. Alterações relevantes serão comunicadas por e-mail ou
              por aviso na plataforma.
            </Text>
          </Section>

          <Divider />

          <Section title="11. Contato e Reclamações">
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              Para exercer seus direitos, tirar dúvidas ou apresentar reclamações relacionadas a
              esta Política de Privacidade, entre em contato pelo e-mail{' '}
              <Anchor href="mailto:contato@maroquio.com">contato@maroquio.com</Anchor>.
            </Text>
            <Text c="dimmed" style={{ lineHeight: 1.8 }}>
              Você também tem o direito de apresentar reclamação à{' '}
              <strong>
                Autoridade Nacional de Proteção de Dados (ANPD)
              </strong>{' '}
              por meio do portal{' '}
              <Anchor href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer">
                www.gov.br/anpd
              </Anchor>
              .
            </Text>
          </Section>
        </Stack>
      </Container>
    </Box>
  );
}
