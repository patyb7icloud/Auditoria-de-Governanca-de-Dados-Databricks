# Configurar credenciais RadarIA no Databricks (AWS)

Este guia configura o `account_id`, o Service Principal OAuth M2M e o Secret Scope usados pelo notebook. Os valores reais de `client_id` e `client_secret` devem ser inseridos diretamente no fluxo seguro de criação de segredo do Databricks/CLI — **nunca neste arquivo, em código, no Job JSON, no Git ou em mensagens**.

## 0. Verifique permissões antes de criar a credencial

O código atual chama a Account API para listar os workspaces da conta e solicita tokens com `scope=all-apis`. A documentação Databricks diz que o Service Principal precisa ser **Account Admin** para chamadas account-level. Essa é uma permissão ampla; obtenha aprovação explícita do administrador de conta e da equipe de segurança antes de concedê-la. O OAuth secret com `all-apis` também é amplo.

Se a política do cliente não aprovar Account Admin ou `all-apis`, **não conceda essa permissão só para fazer o Job rodar**. A alternativa recomendada é adaptar o scanner para receber uma allowlist de workspaces autorizados e remover a enumeração via Account API; o escopo OAuth também deve ser revisto de acordo com as APIs resultantes.

## 1. Obter o Account ID

1. Entre em [Databricks Account Console AWS](https://accounts.cloud.databricks.com) com uma identidade autorizada.
2. Se houver mais de uma conta, selecione a conta correta.
3. Abra o menu da identidade no canto superior direito e copie **Account ID**.
4. Esse valor é o parâmetro `account_id` do Job. Não confunda com o `o=...` na URL do workspace: esse número é o **Workspace ID**.

## 2. Criar ou selecionar o Service Principal

1. No Account Console, abra **User management → Service principals**.
2. Crie um Service Principal dedicado ao RadarIA (ou selecione o já aprovado para esta automação).
3. Atribua-o somente aos workspaces que o Job precisa consultar.
4. Anote o **Application ID/Client ID**; ele não é o Account ID e não é o Client Secret.
5. Conceda os privilégios necessários ao Job/ativos e ao SQL Warehouse conforme a política do cliente. Para a versão atual, a enumeração account-level também requer Account Admin, conforme o aviso no passo 0.

## 3. Gerar o OAuth Client Secret

1. No Account Console, em **User management → Service principals**, selecione o Service Principal.
2. Abra **Credentials & secrets** (ou a aba **Secrets**, conforme a interface) e escolha **Generate secret**.
3. Defina a validade aprovada pela empresa (a documentação permite até 730 dias) e registre a data de expiração no processo de rotação.
4. O código atual envia `scope=all-apis` ao endpoint OAuth. Para usá-lo sem refatoração, o secret/token precisa ser compatível com esse escopo — normalmente mantendo o secret sem restrição mais estreita. Isso não é o princípio do menor privilégio; aprove o risco ou adapte o código e gere um secret com escopos compatíveis antes de ativar.
5. Gere e copie imediatamente o **Client Secret** e confirme o **Client ID**. O Secret aparece uma única vez. Não o coloque em um notebook, parâmetro de Job, `.env` versionado, captura de tela ou conversa.

## 4. Criar o Secret Scope

Use o workspace AWS informado:

`https://dbc-23cb5125-d85e.cloud.databricks.com`

Na interface do workspace:

1. Abra `https://dbc-23cb5125-d85e.cloud.databricks.com/#secrets/createScope`.
2. Crie o scope chamado `governance-secrets`.
3. Em **Manage Principal**, escolha **Creator** se a opção estiver disponível; evite conceder gerenciamento a todos os usuários do workspace.
4. Confirme a criação.

A tela cria o scope, não os valores. Para inserir as chaves, use o Databricks CLI autenticado no workspace. O CLI documentado a partir da versão 0.205 permite inserir cada valor pelo prompt, sem passá-lo como argumento visível.

```bash
# Requer Databricks CLI 0.205+ e abre autenticação interativa no navegador.
databricks auth login https://dbc-23cb5125-d85e.cloud.databricks.com

# Se o scope ainda não tiver sido criado pela interface:
databricks secrets create-scope governance-secrets

# Execute cada comando e cole o valor somente no prompt interativo do CLI.
databricks secrets put-secret governance-secrets radaria-client-id
databricks secrets put-secret governance-secrets radaria-client-secret

# Opcional: conferir apenas nomes/metadata das chaves; não mostra os valores.
databricks secrets list-secrets governance-secrets
```

Não use `--string-value <segredo>` em uma linha de comando: o valor pode ficar em histórico de shell ou logs. Não use `get-secret` para revelar ou copiar um segredo para fora do Databricks.

## 5. Dar READ ao principal que realmente executa o Job

No Databricks Job, identifique **Run as**. É essa identidade que chama `dbutils.secrets.get`; ela precisa de `READ` no scope. Se o Job roda como o Service Principal do passo 2, conceda ao `applicationId` dele; se roda como outra identidade, conceda à identidade efetiva do Job.

Com o CLI autenticado como proprietário/administrador do scope:

```bash
# Substitua pelo Application ID do Service Principal que está em Run as.
databricks secrets put-acl governance-secrets <SERVICE_PRINCIPAL_APPLICATION_ID> READ

# Verifique a ACL concedida; isso não lê o segredo.
databricks secrets get-acl governance-secrets <SERVICE_PRINCIPAL_APPLICATION_ID>
```

Conceda somente `READ` ao principal de execução. Reserve `MANAGE` para o administrador do scope responsável pela rotação. `put-acl` requer que a identidade que executa o comando tenha `MANAGE` no scope.

## 6. Preencher os parâmetros do Job

No template/Job, use valores de configuração e nomes das chaves — não os valores secretos:

```json
{
  "account_id": "<ACCOUNT_ID_COPIADO_DO_ACCOUNT_CONSOLE>",
  "secret_scope": "governance-secrets",
  "client_id_secret_key": "radaria-client-id",
  "client_secret_secret_key": "radaria-client-secret",
  "account_host": "https://accounts.cloud.databricks.com"
}
```

Na conta AWS indicada, `account_host` é `https://accounts.cloud.databricks.com`. O host do workspace continua sendo `https://dbc-23cb5125-d85e.cloud.databricks.com` para operações de workspace; não substitua um pelo outro.

## 7. Código seguro no notebook

Mantenha o notebook usando apenas scope e nomes de keys:

```python
ACCOUNT_HOST = "https://accounts.cloud.databricks.com"

dbutils.widgets.text("account_id", "", "Databricks Account ID")
dbutils.widgets.text("secret_scope", "governance-secrets", "Databricks secret scope")
dbutils.widgets.text("client_id_secret_key", "radaria-client-id", "OAuth client ID secret key")
dbutils.widgets.text("client_secret_secret_key", "radaria-client-secret", "OAuth client secret key")
dbutils.widgets.text("account_host", ACCOUNT_HOST, "Databricks account API host")

account_id = dbutils.widgets.get("account_id").strip()
secret_scope = dbutils.widgets.get("secret_scope").strip()
client_id_secret_key = dbutils.widgets.get("client_id_secret_key").strip()
client_secret_secret_key = dbutils.widgets.get("client_secret_secret_key").strip()
account_host = dbutils.widgets.get("account_host").strip().rstrip("/")

# Os valores são carregados em runtime pelo Secret Scope; não imprimir essas variáveis.
client_id = dbutils.secrets.get(
    scope=secret_scope,
    key=client_id_secret_key,
)
client_secret = dbutils.secrets.get(
    scope=secret_scope,
    key=client_secret_secret_key,
)

scan = scan_account(
    account_id=account_id,
    client_id=client_id,
    client_secret=client_secret,
    account_host=account_host,
)
```

O `ACCOUNT_HOST` constante é o fallback da biblioteca; o widget `account_host` é passado explicitamente pelo notebook. Mantenha ambos alinhados. A autenticação chama primeiro a Account API e, em seguida, os endpoints OAuth dos workspaces.

Se o widget já existia com o valor Azure anterior, mudar o valor padrão no código pode não substituir o valor salvo no notebook. Atualize o widget na interface para `https://accounts.cloud.databricks.com` ou confira o parâmetro correspondente na configuração do Job antes de executar.

## 8. Validar sem revelar credenciais

1. Não use `print(client_id)`, `print(client_secret)`, nem imprima token OAuth ou headers.
2. Confirme que o Job `Run as` consegue ler o scope e que os widgets mostram os nomes corretos do scope/keys.
3. Execute o Job em compute de notebook Python autorizado, não em SQL Warehouse.
4. Se OAuth retornar `401/403`, confira Client ID/Secret, Account ID/host, expiração, escopos do OAuth secret, privilégio de conta, associação do principal aos workspaces e ACL `READ`.
5. Para rotação, gere novo OAuth secret, grave o novo valor na mesma key via prompt (`put-secret` substitui o valor existente), teste uma execução e depois revogue o secret antigo conforme o procedimento da empresa.

Se o Client Secret que constava no DBC original era real, revogue-o e gere outro antes de configurar este scope.

## Referências oficiais

- [OAuth M2M para Service Principals (AWS Databricks)](https://docs.databricks.com/aws/en/dev-tools/auth/oauth-m2m)
- [Tutorial de Secret Scope e `dbutils.secrets.get`](https://docs.databricks.com/aws/en/security/secrets/example-secret-workflow)
- [Gerenciar Databricks secrets](https://docs.databricks.com/aws/en/security/secrets/)
- [Comandos de secrets do Databricks CLI](https://docs.databricks.com/aws/en/dev-tools/cli/reference/secrets-commands)
- [Autenticação do Databricks CLI](https://docs.databricks.com/aws/en/dev-tools/cli/authentication)
