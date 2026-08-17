# Auditoria de Governança de Dados Databricks

Aplicação full-stack para auditar metadados e práticas de governança no **Databricks Unity Catalog**. A ferramenta executa análises de estrutura, documentação, classificação por tags, acesso, linhagem e segurança dinâmica; persiste os resultados e apresenta score, gaps e recomendações em telas executivas.

A documentação operacional e técnica completa está em [`docs/MANUAL_DA_FERRAMENTA.md`](docs/MANUAL_DA_FERRAMENTA.md).

## O que a ferramenta faz

| Recurso | Descrição |
|---|---|
| Auditoria de catálogo | Consulta metadados do Unity Catalog por meio da API Databricks SQL. |
| Score de governança | Consolida documentação, tags, acesso, linhagem e segurança em uma escala de 0 a 100. |
| Dashboard | Exibe KPIs, análises, alertas, gaps e recomendações. |
| Tags | Considera tags aplicadas em tabelas e colunas e conta ativos distintos cobertos. |
| LGPD/GDPR | Detecta potenciais dados pessoais e diferencia valor zero de evidência não verificável. |
| Histórico e comparação | Permite acompanhar sessões e comparar auditorias. |
| Relatórios | Exporta dados da sessão e relatório PDF. |
| Recursos avançados | Inclui módulos de copiloto, FinOps de IA, self-healing e monitoramento quando configurados. |

## Início rápido

```bash
git clone https://github.com/patyb7icloud/Auditoria-de-Governanca-de-Dados-Databricks.git
cd Auditoria-de-Governanca-de-Dados-Databricks
git checkout feat/revolucionario
pnpm install
pnpm check
pnpm test
pnpm dev
```

Acesse `http://localhost:3000`. Para persistir sessões, configure `DATABASE_URL` e execute `pnpm db:push`. Para uso em produção, configure também o mecanismo de autenticação e os segredos exigidos pelo ambiente.

## Configuração mínima

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://usuario:senha@localhost:5432/databricks_governance
JWT_SECRET=gere-um-segredo-forte
```

A conexão com o Databricks é informada pela tela **Nova Auditoria**. O host deve apontar para o workspace, o catálogo deve existir e o token deve conseguir consultar os metadados necessários. Quando disponível, o Azure Key Vault pode fornecer o token sem expô-lo ao navegador.

## Comandos

| Comando | Finalidade |
|---|---|
| `pnpm dev` | Executa o servidor em desenvolvimento com Vite. |
| `pnpm build` | Gera o frontend e o bundle do servidor. |
| `pnpm start` | Inicia o bundle de produção. |
| `pnpm check` | Executa a verificação de tipos TypeScript. |
| `pnpm test` | Executa a suíte Vitest. |
| `pnpm db:push` | Gera e aplica migrações Drizzle. |
| `pnpm format` | Formata o projeto com Prettier. |

## Estrutura principal

```text
client/src/       Interface React, páginas e componentes
server/           API tRPC, consultas Databricks e serviços
shared/           Tipos e constantes compartilhados
drizzle/          Schema e migrações PostgreSQL
scripts/          Diagnóstico e execução por linha de comando
docs/             Documentação técnica e operacional
```

## Pontos importantes

O score é uma medida de maturidade baseada nos metadados visíveis ao usuário e não uma certificação jurídica. A detecção de PII é heurística. Quando o Unity Catalog não fornece uma evidência, a aplicação deve mostrar `N/D`, `Não verificado` ou `—`, e não um número de demonstração.

A métrica de cobertura de tags conta **ativos distintos** com tags em tabelas ou colunas. A quantidade de linhas de tags não é usada como quantidade de ativos, porque um mesmo ativo pode ter múltiplas tags.

## Documentação

- [Manual da ferramenta](docs/MANUAL_DA_FERRAMENTA.md): instalação, operação, arquitetura, API, métricas, LGPD, segurança e troubleshooting.
- [Documentação técnica anterior](docs/DOCUMENTACAO_TECNICA.md): referência histórica e detalhes adicionais do projeto.
- [Guia LGPD](docs/LGPD_COMPLIANCE_GUIDE.md): material complementar sobre o módulo de conformidade.
- [Relatório da correção de tags e LGPD](AUDITORIA_CORRECAO_TAGS_LGPD.md): diagnóstico e validação da correção publicada na branch atual.

## Licença e segurança

Não publique tokens, senhas, URLs privadas, dumps de dados ou arquivos `.env`. Antes de executar qualquer ação de self-healing, revise os comandos SQL, valide-os em ambiente de teste e obtenha aprovação do responsável pelo catálogo.
