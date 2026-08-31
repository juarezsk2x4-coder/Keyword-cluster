# Olá! 💛

Esse app agora é **todo seu** — planeja a alimentação da semana, gera lista de compras, e ajusta tudo conforme você vai comendo no dia a dia. É só seu, pra você continuar do seu jeito, adicionar suas próprias referências, mudar o que quiser. Pra começar, preencha 2 arquivinhos aqui nessa pasta:

1. **`meu-perfil.yml`** — seus dados (idade, altura, peso, treinos, café, etc.)
2. **`minhas-preferencias.yml`** — o que você gosta, o que não gosta, o que não pode

Não precisa ser nutricionista nem entender de programação. **Só substituir os `FILL_IN` pelo seu valor.** O que tiver `#` no começo da linha é só comentário — pode deixar lá ou apagar, tanto faz.

## Como editar

**Opção 1 — Mais fácil:** abre os arquivos no app de Notas do celular ou em qualquer editor de texto (Word, Google Docs, Bloco de Notas). Substitui os `FILL_IN` e me devolve. Eu colo no sistema.

**Opção 2:** se tiver o VS Code instalado, abre a pasta direto. Ele já entende YAML e mostra erros de formatação.

## Regras de formato (importantes pra não quebrar)

- **Decimais com ponto, não vírgula.** Escreve `1.5 kg`, não `1,5 kg`.
- **Horários entre aspas.** `"23:00"`, não `23:00`.
- **Verdadeiro/falso em inglês minúsculo.** `true` ou `false`.
- **Listas vazias.** Se não tem nada, deixa assim: `[]` (com colchetes).
- **Não mexe nos nomes dos campos** (à esquerda dos dois pontos). Só nos valores.

## Sobre as perguntas mais íntimas

O sistema pergunta sobre **café, álcool, maconha, cigarro, anticoncepcional, ciclo menstrual** e **exames de sangue** porque tudo isso muda o que o corpo precisa de nutriente. Por exemplo:

- Café demais perto da hora de dormir → mais magnésio à noite ajuda
- Anticoncepcional combinado → costuma reduzir B6, B12 e folato
- Fluxo menstrual intenso → mais ferro nos dias seguintes
- Álcool no fim de semana → o sistema reequilibra calorias e B-complex na semana

**Nada disso é julgamento, é só pra calibrar.** Se algum item te incomoda responder, pula. O agente trabalha com o que você der.

## Sobre a alergia a tomate

Se tomate for uma alergia ou restrição sua também, deixe marcado — o sistema NUNCA vai sugerir nada com tomate em forma alguma (nem molho, nem extrato, nem ketchup, nem lasanha tradicional, nem pizza marinara). Se não for uma restrição sua, é só remover — os arquivos aqui são só seus, ajuste como quiser.

## Quando terminar

Esses dois arquivos alimentam `data/profiles/person_b.yml` e `data/preferences.yml` — que é o que o app de fato lê. Se estiver usando o Claude Code (ou outra IA), é só pedir pra ele transcrever o que você preencheu aqui pros arquivos técnicos — leva menos de um minuto. Se preferir, edite `data/profiles/person_b.yml` diretamente (mesma ideia, só que em inglês).

Qualquer dúvida sobre o que algum campo quer dizer, pergunta pra IA ou ajusta como fizer sentido pra você. Beijo! 🥗
