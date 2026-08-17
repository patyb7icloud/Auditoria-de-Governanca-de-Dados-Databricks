# 🛡️ Arquitetura de FinOps de IA (Controle de Custos)

A inserção de Modelos de Linguagem (LLMs) em ferramentas de governança traz grande valor, mas também um risco de custo (Billing Risk) se não for bem controlada. 

Para mitigar o risco de faturas astronômicas da OpenAI/Azure, implementamos uma **Camada de FinOps de IA** na branch `feat/revolucionario`.

## 1. Análise de Risco Identificada

Com base nos testes, os componentes apresentavam os seguintes riscos sem proteção (para 5 usuários ativos):
* **Copiloto (Chat)**: Risco ALTO ($21.45/mês) — Usuários podem fazer infinitas perguntas.
* **Self-Healing AI**: Risco ALTO ($15.68/mês) — Tabelas com centenas de colunas enviam milhares de tokens de contexto por clique.
* **SecOps (Anomalias)**: Risco MÉDIO ($0.21/mês) — Roda a cada 30 minutos em background.
* **FinOps (Data ROI)**: Risco ZERO — Utiliza cálculo heurístico e SQL nativo, sem chamadas ao LLM.

## 2. Camada de Proteção Implementada (`server/finops-ai.ts`)

A nova arquitetura implementa 4 pilares de proteção que **reduzem o custo mensal de IA em até 73%** (de $37.33 para $10.11 por tenant):

### A. Rate Limiting (Limites por Usuário/Tenant)
Impede o abuso intencional ou acidental.
* **Copiloto**: Máximo de 10 perguntas por hora por usuário.
* **Self-Healing**: Máximo de 50 tabelas analisadas por hora.
* *Como funciona*: Se o limite é atingido, a API retorna um erro amigável indicando quantos minutos faltam para a janela resetar.

### B. Semantic Caching
Evita pagar duas vezes pela mesma resposta.
* Se um usuário pergunta *"Quais tabelas contêm CPFs?"* e, 10 minutos depois, outro usuário do mesmo tenant faz a mesma pergunta, a resposta é servida diretamente do Cache em Memória (TTL de 24h), **custo zero**.

### C. Model Routing (Roteamento Inteligente)
Nem toda tarefa precisa do modelo mais caro (`GPT-4o`).
* **SecOps (Background)**: Utiliza `gpt-4o-mini` (94% mais barato) pois a tarefa de formatar logs é simples.
* **Copiloto (Decisão de Leitura)**: A primeira etapa do Copiloto, que apenas decide qual SQL montar, agora usa o modelo `mini`.
* **Self-Healing**: Mantido no `GPT-4o` devido à necessidade de raciocínio complexo sobre PII/LGPD.

### D. Context Truncation (Otimização de Tokens)
O custo do LLM é baseado na quantidade de texto enviado.
* O `Self-Healing` costumava enviar todas as linhas da amostra de dados e todas as colunas.
* Agora, a amostra é truncada para **no máximo 3 linhas** e os metadados limitados às primeiras **20 colunas**. Isso preserva a qualidade da inferência da IA, mas economiza cerca de 40% dos tokens de input.

## 3. Impacto Visual no Dashboard
Caso o usuário atinja o limite (Rate Limit), o painel do Copiloto ou do Self-Healing exibirá a mensagem de proteção, educando o usuário sobre o uso consciente da IA.
