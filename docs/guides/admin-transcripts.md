# Como cadastrar a repetição de frase (`/admin/transcripts`)

## O que é essa funcionalidade

Nas telas de **Vídeos avulsos**, **Séries** e **Filmes**, o aluno tem a opção de repetir em loop só a frase que está tocando naquele momento (não o vídeo inteiro), com:

- **Velocidade** ajustável (0.5x / 0.75x / 1x / 1.25x)
- **Repetir**: fica repetindo só o trecho da frase atual até o aluno desligar
- **Modo Drill**: esconde a tradução em português até o aluno tocar em "Toque pra ver a tradução"
- A frase exibida **acompanha o vídeo sozinha** conforme ele toca (tipo legenda) — o aluno só precisa navegar manualmente se quiser pular pra outro trecho

Essa seção **só aparece na tela se existir transcript cadastrado** para aquele conteúdo. Sem cadastro, a tela continua funcionando normalmente (vídeo toca, tudo certo), só sem essa seção — nada quebra.

## Pré-requisito: o conteúdo precisa existir antes

O formulário de transcript não cadastra vídeo novo — ele só adiciona frases a um vídeo/episódio/filme **que já foi cadastrado antes**, em uma dessas telas:

| Tipo de conteúdo | Cadastre primeiro em |
|---|---|
| Vídeo avulso | `/admin/playlists` |
| Episódio de série | `/admin/series` |
| Filme | `/admin/filmes` |

Só depois de cadastrado ali, o item aparece no dropdown de `/admin/transcripts`.

## Passo a passo

1. Acesse **`/admin/transcripts`** logado como responsável (perfil admin).
2. No campo **"Vídeo ou episódio"**, selecione o conteúdo na lista — cada item aparece com um rótulo `[Vídeo]`, `[Episódio]` ou `[Filme]` na frente do título, pra você saber de onde ele vem.
   - Se esse conteúdo já tiver frases cadastradas, elas aparecem automaticamente pra edição.
   - Se for a primeira vez, a lista vem vazia.
3. Clique em **"+ Adicionar frase"** pra cada frase que você quiser cadastrar. Pra cada uma, preencha:

   | Campo | O que colocar |
   |---|---|
   | **Início (s)** | Segundo exato em que a frase começa no vídeo (ex: `12.5`) |
   | **Fim (s)** | Segundo exato em que a frase termina (precisa ser maior que o início) |
   | **Inglês** | O texto da frase em inglês, exatamente como é falado |
   | **Português** | A tradução da frase |

   **Como descobrir o início/fim:** assista ao vídeo (no YouTube mesmo, ou na própria tela do app) e anote o tempo (em segundos) de onde cada frase começa e termina. Não precisa ser cirúrgico no décimo de segundo — um segundo de folga não atrapalha.

4. Cadastre as frases **na ordem em que elas aparecem no vídeo** (a primeira frase deve ser a linha 1, a segunda a linha 2, e assim por diante). A ordem final é sempre a posição da linha na lista — não existe um campo de "ordem" pra preencher à parte.
5. Use **"Remover"** pra apagar uma linha antes de salvar, se precisar.
6. Clique em **"Salvar transcript"**.

   ⚠️ **Atenção:** salvar **substitui a lista inteira** de frases daquele conteúdo pelas que estão na tela naquele momento. Se você editar um vídeo que já tinha frases, apague ou esqueça uma linha sem querer, ela some. Sempre confira a lista completa antes de salvar.

## Depois de salvar

A seção de repetição já aparece pro aluno na tela correspondente:

- Vídeo avulso → `/videos/[id]`
- Episódio → `/series/[id]` (a lista de frases é por episódio — trocar de episódio troca o transcript também)
- Filme → `/filmes/[id]`

**Filmes com mais de 20 frases** ganham automaticamente uma lista de "Capítulos" (agrupados a cada 1 minuto do vídeo) pra o aluno pular direto pra um trecho, sem precisar navegar frase por frase. Vídeos e episódios curtos não mostram isso — só o filme, quando o transcript é grande o suficiente.

## Exemplo prático

Pra um vídeo com a fala "*Once upon a time, there were three little rabbits.*":

| Início (s) | Fim (s) | Inglês | Português |
|---|---|---|---|
| 0 | 5 | Once upon a time... | Era uma vez... |
| 5 | 9 | There were three little rabbits. | Havia três coelhinhos. |

Depois de salvar essas duas linhas pra esse vídeo, a tela dele já mostra os controles de repetição automaticamente.
