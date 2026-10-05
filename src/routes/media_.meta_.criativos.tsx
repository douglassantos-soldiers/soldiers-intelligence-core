import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  PageHeader,
  Kpi,
  Panel,
  Loading,
  ErrorBox,
  Table,
  Td,
  StatusTag,
  Empty,
  Pills,
} from "@/components/kit";
import {
  getCriativosInicio,
  criarLote,
  urlsDeUpload,
  salvarItens,
  confirmarLote,
  getLote,
  reenviarErros,
  cancelarLote,
} from "@/lib/criativos.functions";
import {
  validaLote,
  nomePadrao,
  lePlanilha,
  tipoDoMime,
  type ItemCriativo,
} from "@/domain/criativos";
import { fmtNum, fmtDate } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";

// Meta Ads: subida de criativos em massa para a BIBLIOTECA (não cria anúncio, não gasta verba).
// Fluxo: novo lote → arquivos + planilha de copy → validação → envio dos arquivos ao armazenamento →
// confirmação digitando o total → fila → executor (Edge Function) → acompanhamento e auditoria.
export const Route = createFileRoute("/media_/meta_/criativos")({
  head: () => ({
    meta: [
      { title: "Meta Ads: subir criativos — Soldiers Platform" },
      {
        name: "description",
        content:
          "Subida de criativos em massa para a biblioteca do Meta Ads, com validação, confirmação e auditoria.",
      },
    ],
  }),
  component: Criativos,
});

const BUCKET = "meta-criativos";

// ---------------------------------------------------------------------------------------------
// Sessão (Supabase Auth)

function useSessao() {
  const [estado, setEstado] = useState<{ carregando: boolean; email: string | null }>({
    carregando: true,
    email: null,
  });
  useEffect(() => {
    let ativo = true;
    supabase.auth
      .getSession()
      .then(
        ({ data }) =>
          ativo && setEstado({ carregando: false, email: data.session?.user.email ?? null }),
      )
      .catch(() => ativo && setEstado({ carregando: false, email: null }));
    const { data } = supabase.auth.onAuthStateChange(
      (_e, s) => ativo && setEstado({ carregando: false, email: s?.user.email ?? null }),
    );
    return () => {
      ativo = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return estado;
}

function Entrar() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  return (
    <Panel title="Entrar">
      <p className="mb-3 text-sm text-muted-foreground">
        Subir criativos exige login. Informe seu e-mail da Soldiers: você recebe um link de acesso.
        Só e-mails autorizados conseguem montar e confirmar lotes.
      </p>
      <form
        className="flex max-w-md gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setErro(null);
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: window.location.href },
          });
          if (error) setErro(error.message);
          else setMsg("Link enviado. Abra o e-mail neste navegador.");
        }}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@soldiersnutrition.com.br"
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Enviar link
        </button>
      </form>
      {msg && <p className="mt-3 text-sm text-success">{msg}</p>}
      {erro && <p className="mt-3 text-sm text-destructive">{erro}</p>}
    </Panel>
  );
}

// ---------------------------------------------------------------------------------------------

function Criativos() {
  const sessao = useSessao();
  const [loteAberto, setLoteAberto] = useState<string | null>(null);
  return (
    <>
      <PageHeader
        title="Subir criativos"
        subtitle="Em massa para a biblioteca do Meta Ads: validado, confirmado por você e registrado. Não cria anúncios."
        right={
          <Link to="/media/meta" className="text-sm font-medium text-primary hover:underline">
            ← Meta Ads
          </Link>
        }
      />
      {sessao.carregando ? (
        <Loading />
      ) : !sessao.email ? (
        <Entrar />
      ) : loteAberto ? (
        <LoteView id={loteAberto} voltar={() => setLoteAberto(null)} />
      ) : (
        <Inicio abrir={setLoteAberto} />
      )}
    </>
  );
}

type Inicio = Awaited<ReturnType<typeof getCriativosInicio>>;

const STATUS_LOTE: Record<
  string,
  { rotulo: string; tom: "muted" | "primary" | "success" | "warn" | "danger" }
> = {
  rascunho: { rotulo: "rascunho", tom: "muted" },
  confirmado: { rotulo: "na fila", tom: "primary" },
  enviando: { rotulo: "enviando", tom: "primary" },
  concluido: { rotulo: "concluído", tom: "success" },
  concluido_com_erros: { rotulo: "concluído com erros", tom: "warn" },
  cancelado: { rotulo: "cancelado", tom: "muted" },
};

function Inicio({ abrir }: { abrir: (id: string) => void }) {
  const fn = useServerFn(getCriativosInicio);
  const q = useQuery({ queryKey: ["criativos-inicio"], queryFn: () => fn() });
  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const d = q.data!;
  return (
    <div className="space-y-6">
      {!d.executorConfigurado && (
        <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 text-sm">
          O executor ainda não está configurado (CRIATIVOS_FUNCTION_SECRET). Os lotes confirmados
          ficam na fila até a Edge Function ser publicada ou o agendamento (pg_cron) rodar.
        </div>
      )}
      {d.contasSemPermissao.length > 0 && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">
          O token da(s) conta(s) {d.contasSemPermissao.join(", ")} não tem a permissão
          ads_management. Sem ela o Meta recusa a criação de criativos: gere um token de usuário do
          sistema com ads_management.
        </div>
      )}
      <NovoLote d={d} criado={abrir} />
      <Panel title="Lotes">
        {d.lotes.length ? (
          <Table
            head={[
              "Lote",
              "Conta",
              "Status",
              "Criativos",
              "Criados no Meta",
              "Erros",
              "Criado por",
              "Quando",
              "",
            ]}
          >
            {d.lotes.map((l) => {
              const total = Object.values(l.contagem).reduce((s, x) => s + x, 0);
              const s = STATUS_LOTE[l.status] ?? { rotulo: l.status, tom: "muted" as const };
              return (
                <tr key={l.id}>
                  <Td className="max-w-[240px] truncate font-medium">{l.nome}</Td>
                  <Td mono>{l.conta}</Td>
                  <Td>
                    <StatusTag tone={s.tom}>{s.rotulo}</StatusTag>
                  </Td>
                  <Td mono>{fmtNum(total)}</Td>
                  <Td mono>{fmtNum(l.contagem["enviado"] ?? 0)}</Td>
                  <Td mono className={(l.contagem["erro"] ?? 0) ? "text-destructive" : ""}>
                    {fmtNum((l.contagem["erro"] ?? 0) + (l.contagem["invalido"] ?? 0))}
                  </Td>
                  <Td className="max-w-[200px] truncate">{l.criadoPor}</Td>
                  <Td mono>{fmtDate(l.criadoEm)}</Td>
                  <Td>
                    <button
                      className="text-sm font-medium text-primary hover:underline"
                      onClick={() => abrir(l.id)}
                    >
                      Abrir
                    </button>
                  </Td>
                </tr>
              );
            })}
          </Table>
        ) : (
          <Empty>Nenhum lote ainda.</Empty>
        )}
      </Panel>
    </div>
  );
}

const campo = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm";

function NovoLote({ d, criado }: { d: Inicio; criado: (id: string) => void }) {
  const fn = useServerFn(criarLote);
  const [f, setF] = useState({
    nome: "",
    adAccountId: d.contas[0] ?? "",
    pageId: "",
    instagramUserId: "",
    linkPadrao: "https://www.soldiersnutrition.com.br/",
    urlTagsPadrao:
      "utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}",
    ctaPadrao: "SHOP_NOW",
  });
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF({ ...f, [k]: e.target.value });
  return (
    <Panel title="Novo lote">
      <form
        className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setErro(null);
          setEnviando(true);
          try {
            const r = await fn({ data: f });
            criado(r.id);
          } catch (x) {
            setErro(x instanceof Error ? x.message : String(x));
          } finally {
            setEnviando(false);
          }
        }}
      >
        <label className="text-xs text-muted-foreground">
          Nome do lote
          <input
            className={campo}
            required
            minLength={3}
            value={f.nome}
            onChange={set("nome")}
            placeholder="Black Friday · Creatina · UGC"
          />
        </label>
        <label className="text-xs text-muted-foreground">
          Conta de anúncio
          <select className={campo} value={f.adAccountId} onChange={set("adAccountId")}>
            {d.contas.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted-foreground">
          ID da página do Facebook
          <input
            className={campo}
            required
            pattern="\d+"
            value={f.pageId}
            onChange={set("pageId")}
          />
        </label>
        <label className="text-xs text-muted-foreground">
          ID do Instagram (opcional)
          <input
            className={campo}
            pattern="\d*"
            value={f.instagramUserId}
            onChange={set("instagramUserId")}
          />
        </label>
        <label className="text-xs text-muted-foreground md:col-span-2">
          Link padrão
          <input className={campo} value={f.linkPadrao} onChange={set("linkPadrao")} />
        </label>
        <label className="text-xs text-muted-foreground">
          Parâmetros de URL padrão
          <input className={campo} value={f.urlTagsPadrao} onChange={set("urlTagsPadrao")} />
        </label>
        <label className="text-xs text-muted-foreground">
          Botão padrão
          <select className={campo} value={f.ctaPadrao} onChange={set("ctaPadrao")}>
            {Object.entries(d.ctas).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-3 md:col-span-2 2xl:col-span-4">
          <button
            disabled={enviando}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Criar lote e escolher arquivos
          </button>
          <span className="text-xs text-muted-foreground">
            Até {d.limites.maxItens} criativos por lote · imagem até {d.limites.imagemMB} MB · vídeo
            até {d.limites.videoMB} MB.
          </span>
          {erro && <span className="text-sm text-destructive">{erro}</span>}
        </div>
      </form>
    </Panel>
  );
}

// ---------------------------------------------------------------------------------------------
// Lote: montagem (rascunho) ou acompanhamento

function LoteView({ id, voltar }: { id: string; voltar: () => void }) {
  const fn = useServerFn(getLote);
  const q = useQuery({
    queryKey: ["criativos-lote", id],
    queryFn: () => fn({ data: { loteId: id } }),
    refetchInterval: (query) =>
      ["confirmado", "enviando"].includes(query.state.data?.lote.status ?? "") ? 10_000 : false,
  });
  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const d = q.data!;
  return (
    <div className="space-y-6">
      <button className="text-sm font-medium text-primary hover:underline" onClick={voltar}>
        ← Todos os lotes
      </button>
      {d.lote.status === "rascunho" ? <Montagem d={d} /> : <Acompanhamento d={d} />}
    </div>
  );
}

type LoteD = Awaited<ReturnType<typeof getLote>>;

type Linha = {
  chave: string;
  file: File;
  capa: File | null;
  tipo: "imagem" | "video";
  mime: string;
  bytes: number;
  sha256: string;
  largura: number | null;
  altura: number | null;
  duracaoSeg: number | null;
  nomeCriativo: string;
  textoPrincipal: string;
  titulo: string;
  descricao: string;
  cta: string;
  link: string;
  urlTags: string;
  path?: string;
  capaPath?: string;
  upload: "pendente" | "enviando" | "enviado" | "erro";
};

// FileReader como alternativa: alguns navegadores antigos (e o jsdom dos testes) não têm Blob.arrayBuffer/text.
function lerArquivo(file: Blob, comoTexto: true): Promise<string>;
function lerArquivo(file: Blob, comoTexto?: false): Promise<ArrayBuffer>;
function lerArquivo(file: Blob, comoTexto = false): Promise<string | ArrayBuffer> {
  if (comoTexto && typeof file.text === "function") return file.text();
  if (!comoTexto && typeof file.arrayBuffer === "function") return file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string | ArrayBuffer);
    r.onerror = () => reject(r.error);
    if (comoTexto) r.readAsText(file);
    else r.readAsArrayBuffer(file);
  });
}

async function sha256(file: Blob) {
  const buf = await crypto.subtle.digest("SHA-256", await lerArquivo(file));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function medidas(
  file: File,
  tipo: "imagem" | "video",
): Promise<{ largura: number | null; altura: number | null; duracaoSeg: number | null }> {
  if (tipo === "imagem") {
    try {
      const bmp = await createImageBitmap(file);
      const r = { largura: bmp.width, altura: bmp.height, duracaoSeg: null };
      bmp.close();
      return r;
    } catch {
      return { largura: null, altura: null, duracaoSeg: null };
    }
  }
  return new Promise((resolve) => {
    const v = document.createElement("video");
    const url = URL.createObjectURL(file);
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      resolve({
        largura: v.videoWidth || null,
        altura: v.videoHeight || null,
        duracaoSeg: Number.isFinite(v.duration) ? v.duration : null,
      });
      URL.revokeObjectURL(url);
    };
    v.onerror = () => {
      resolve({ largura: null, altura: null, duracaoSeg: null });
      URL.revokeObjectURL(url);
    };
    v.src = url;
  });
}

async function emParalelo<T>(itens: T[], limite: number, fn: (t: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limite, itens.length) }, async () => {
      while (i < itens.length) await fn(itens[i++]!);
    }),
  );
}

type Resultado = { ok: boolean; path?: string; capaPath?: string };

function comResultado(l: Linha, r: Resultado): Linha {
  if (!r.ok) return { ...l, upload: "erro" };
  const n: Linha = { ...l, upload: "enviado" };
  if (r.path) n.path = r.path;
  if (r.capaPath) n.capaPath = r.capaPath;
  return n;
}

function Montagem({ d }: { d: LoteD }) {
  const qc = useQueryClient();
  const fUrls = useServerFn(urlsDeUpload);
  const fSalvar = useServerFn(salvarItens);
  const fConfirmar = useServerFn(confirmarLote);
  const fCancelar = useServerFn(cancelarLote);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [lendo, setLendo] = useState(0);
  const [etapa, setEtapa] = useState<"montando" | "enviando" | "salvo">(
    d.itens.length ? "salvo" : "montando",
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [digitado, setDigitado] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "erro">("todos");
  const inputRef = useRef<HTMLInputElement>(null);

  const itensValidacao: ItemCriativo[] = linhas.map((l) => ({ ...l, arquivoNome: l.file.name }));
  const v = useMemo(() => validaLote(itensValidacao), [linhas]); // eslint-disable-line react-hooks/exhaustive-deps

  async function adicionar(files: FileList | File[]) {
    const lista = [...files].filter((f) => tipoDoMime(f.type));
    const ignorados = [...files].length - lista.length;
    setLendo(lista.length);
    const novas: Linha[] = [];
    await emParalelo(lista, 3, async (file) => {
      const tipo = tipoDoMime(file.type)!;
      const [hash, m] = await Promise.all([sha256(file), medidas(file, tipo)]);
      novas.push({
        chave: `${hash}-${file.name}`,
        file,
        capa: null,
        tipo,
        mime: file.type,
        bytes: file.size,
        sha256: hash,
        ...m,
        nomeCriativo: "",
        textoPrincipal: "",
        titulo: "",
        descricao: "",
        cta: d.lote.ctaPadrao,
        link: d.lote.linkPadrao,
        urlTags: d.lote.urlTagsPadrao,
        upload: "pendente",
      });
      setLendo((x) => x - 1);
    });
    setLinhas((atual) => {
      const todas = [...atual, ...novas.sort((a, b) => a.file.name.localeCompare(b.file.name))];
      return todas.map((l, k) =>
        l.nomeCriativo
          ? l
          : { ...l, nomeCriativo: nomePadrao(d.lote.nome, l.tipo, l.largura, l.altura, k + 1) },
      );
    });
    if (ignorados) setMsg(`${ignorados} arquivo(s) ignorado(s): use JPG, PNG, MP4 ou MOV.`);
  }

  async function aplicarPlanilha(file: File) {
    const rows = lePlanilha(await lerArquivo(file, true));
    const porArquivo = new Map(rows.map((r) => [r.arquivo.toLowerCase(), r]));
    const casados = linhas.filter((l) => porArquivo.has(l.file.name.toLowerCase())).length;
    setLinhas((atual) =>
      atual.map((l) => {
        const r = porArquivo.get(l.file.name.toLowerCase());
        if (!r) return l;
        return {
          ...l,
          nomeCriativo: r.nome || l.nomeCriativo,
          textoPrincipal: r.texto ?? l.textoPrincipal,
          titulo: r.titulo ?? l.titulo,
          descricao: r.descricao ?? l.descricao,
          cta: r.cta || l.cta,
          link: r.link || l.link,
          urlTags: r.url_tags || l.urlTags,
        };
      }),
    );
    setMsg(
      `Planilha aplicada: ${casados} de ${rows.length} linha(s) casaram com arquivos pelo nome.`,
    );
  }

  const muda = (chave: string, campo: keyof Linha, valor: unknown) =>
    setLinhas((a) => a.map((l) => (l.chave === chave ? { ...l, [campo]: valor } : l)));
  const aplicaTodos = (
    campo: "textoPrincipal" | "titulo" | "descricao" | "cta" | "link" | "urlTags",
    valor: string,
  ) => setLinhas((a) => a.map((l) => ({ ...l, [campo]: valor })));

  async function enviarESalvar() {
    setErro(null);
    setMsg(null);
    setEtapa("enviando");
    try {
      const pendentes = linhas.filter((l) => l.upload !== "enviado");
      const pedidos = [
        ...pendentes.map((l) => ({ sha256: l.sha256, mime: l.mime, bytes: l.bytes })),
        ...pendentes
          .filter((l) => l.capa)
          .map((l) => ({ sha256: l.sha256, mime: l.capa!.type, bytes: l.capa!.size, capa: true })),
      ];
      const urls = pedidos.length
        ? await fUrls({ data: { loteId: d.lote.id, arquivos: pedidos } })
        : [];
      const principal = new Map(
        urls.filter((u) => !u.path.includes("/capa_")).map((u) => [u.sha256, u]),
      );
      const capas = new Map(
        urls.filter((u) => u.path.includes("/capa_")).map((u) => [u.sha256, u]),
      );
      const resultados = new Map<string, Resultado>();
      await emParalelo(pendentes, 4, async (l) => {
        muda(l.chave, "upload", "enviando");
        const u = principal.get(l.sha256)!;
        const r = await supabase.storage
          .from(BUCKET)
          .uploadToSignedUrl(u.path, u.token, l.file, { contentType: l.mime });
        let capaPath: string | undefined;
        if (!r.error && l.capa) {
          const c = capas.get(l.sha256)!;
          const rc = await supabase.storage
            .from(BUCKET)
            .uploadToSignedUrl(c.path, c.token, l.capa, { contentType: l.capa.type });
          if (!rc.error) capaPath = c.path;
        }
        const res: Resultado = r.error
          ? { ok: false }
          : { ok: true, path: u.path, ...(capaPath ? { capaPath } : {}) };
        resultados.set(l.chave, res);
        setLinhas((a) => a.map((x) => (x.chave === l.chave ? comResultado(x, res) : x)));
      });
      // Junta o que já tinha subido antes com o resultado desta rodada (sem depender do estado do React).
      const finais = linhas.map((l) => {
        const res = resultados.get(l.chave);
        return res ? comResultado(l, res) : l;
      });
      const falhas = finais.filter((l) => l.upload !== "enviado");
      if (falhas.length)
        throw new Error(
          `${falhas.length} arquivo(s) não subiram. Tente de novo; os que já subiram não sobem outra vez.`,
        );
      const r = await fSalvar({
        data: {
          loteId: d.lote.id,
          itens: finais.map((l) => ({
            arquivoPath: l.path!,
            arquivoNome: l.file.name,
            tipo: l.tipo,
            mime: l.mime,
            bytes: l.bytes,
            sha256: l.sha256,
            largura: l.largura,
            altura: l.altura,
            duracaoSeg: l.duracaoSeg,
            nomeCriativo: l.nomeCriativo,
            textoPrincipal: l.textoPrincipal,
            titulo: l.titulo,
            descricao: l.descricao,
            cta: l.cta,
            link: l.link,
            urlTags: l.urlTags,
            thumbnailPath: l.capaPath ?? null,
          })),
        },
      });
      setEtapa("salvo");
      setMsg(
        r.invalidos
          ? `${r.invalidos} criativo(s) recusados pela validação do servidor. Corrija e salve de novo.`
          : `${r.total} criativos salvos e validados.`,
      );
      if (r.invalidos) setEtapa("montando");
      qc.invalidateQueries({ queryKey: ["criativos-lote", d.lote.id] });
    } catch (x) {
      setErro(x instanceof Error ? x.message : String(x));
      setEtapa("montando");
    }
  }

  const salvos = d.itens.length;
  const invalidosSalvos = d.itens.filter((i) => i.status === "invalido").length;
  const visiveis = filtro === "erro" ? linhas.filter((_, k) => v.itens[k]!.erros.length) : linhas;

  return (
    <div className="space-y-6">
      <Panel title={`Lote: ${d.lote.nome}`} right={<StatusTag tone="muted">rascunho</StatusTag>}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi label="Conta" value={d.lote.conta} />
          <Kpi label="Página" value={d.lote.pageId} />
          <Kpi
            label="Na tela"
            value={fmtNum(linhas.length)}
            hint={
              lendo ? `lendo ${lendo} arquivo(s)…` : `${v.validos} válidos · ${v.comErro} com erro`
            }
          />
          <Kpi
            label="Salvos no lote"
            value={fmtNum(salvos)}
            hint={invalidosSalvos ? `${invalidosSalvos} recusados pelo servidor` : undefined}
          />
        </div>
      </Panel>

      {(etapa !== "salvo" || !salvos) && (
        <Panel title="1. Arquivos e copy">
          <div
            className="rounded-lg border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void adicionar(e.dataTransfer.files);
            }}
          >
            Arraste imagens e vídeos aqui ou{" "}
            <button
              className="font-medium text-primary hover:underline"
              onClick={() => inputRef.current?.click()}
            >
              escolha arquivos
            </button>
            . Até 300 por lote.
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,video/mp4,video/quicktime"
              className="hidden"
              onChange={(e) => e.target.files && void adicionar(e.target.files)}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <label className="cursor-pointer font-medium text-primary hover:underline">
              Aplicar planilha de copy (CSV)
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && void aplicarPlanilha(e.target.files[0])}
              />
            </label>
            <span className="text-xs text-muted-foreground">
              Colunas: arquivo, nome, texto, titulo, descricao, cta, link, url_tags (separador , ou
              ;). Casa pelo nome do arquivo.
            </span>
          </div>
        </Panel>
      )}

      {linhas.length > 0 && (
        <Panel
          title="2. Revisar"
          right={
            <Pills
              value={filtro}
              onChange={setFiltro}
              options={[
                { id: "todos", label: `Todos (${linhas.length})` },
                { id: "erro", label: `Com erro (${v.comErro})` },
              ]}
            />
          }
        >
          <div className="mb-3 grid gap-2 md:grid-cols-3">
            <AplicaTodos
              rotulo="Texto principal para todos"
              onAplicar={(x) => aplicaTodos("textoPrincipal", x)}
            />
            <AplicaTodos rotulo="Título para todos" onAplicar={(x) => aplicaTodos("titulo", x)} />
            <AplicaTodos rotulo="Link para todos" onAplicar={(x) => aplicaTodos("link", x)} />
          </div>
          {v.erroLote && <p className="mb-3 text-sm text-destructive">{v.erroLote}</p>}
          <Table
            head={[
              "Arquivo",
              "Situação",
              "Nome do criativo",
              "Texto principal",
              "Título",
              "Botão",
              "Link",
            ]}
          >
            {visiveis.map((l) => {
              const k = linhas.indexOf(l);
              const val = v.itens[k]!;
              return (
                <tr key={l.chave}>
                  <Td className="max-w-[180px]">
                    <div className="truncate" title={l.file.name}>
                      {l.file.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {l.tipo} · {l.largura && l.altura ? `${l.largura}×${l.altura}` : "?"} ·{" "}
                      {l.bytes >= 1048576
                        ? `${(l.bytes / 1048576).toFixed(1)} MB`
                        : `${Math.max(1, Math.round(l.bytes / 1024))} KB`}
                    </div>
                    {l.tipo === "video" && (
                      <label className="cursor-pointer text-xs text-primary hover:underline">
                        {l.capa ? `capa: ${l.capa.name}` : "escolher capa (opcional)"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png"
                          className="hidden"
                          onChange={(e) => muda(l.chave, "capa", e.target.files?.[0] ?? null)}
                        />
                      </label>
                    )}
                  </Td>
                  <Td className="min-w-[260px]">
                    <ul className="space-y-1 text-xs">
                      {l.upload === "enviando" && <li className="text-primary">subindo…</li>}
                      {l.upload === "erro" && <li className="text-destructive">falhou ao subir</li>}
                      {val.erros.map((x) => (
                        <li key={x} className="text-destructive">
                          ✕ {x}
                        </li>
                      ))}
                      {val.avisos.map((x) => (
                        <li key={x} className="text-warning">
                          ! {x}
                        </li>
                      ))}
                      {!val.erros.length && !val.avisos.length && l.upload !== "erro" && (
                        <li className="text-success">✓ ok</li>
                      )}
                    </ul>
                  </Td>
                  <Td className="min-w-[230px]">
                    <input
                      className={campo}
                      value={l.nomeCriativo}
                      onChange={(e) => muda(l.chave, "nomeCriativo", e.target.value)}
                    />
                  </Td>
                  <Td className="min-w-[220px]">
                    <textarea
                      className={campo}
                      rows={2}
                      value={l.textoPrincipal}
                      onChange={(e) => muda(l.chave, "textoPrincipal", e.target.value)}
                    />
                  </Td>
                  <Td className="min-w-[170px]">
                    <input
                      className={campo}
                      value={l.titulo}
                      onChange={(e) => muda(l.chave, "titulo", e.target.value)}
                    />
                  </Td>
                  <Td className="min-w-[150px]">
                    <select
                      className={campo}
                      value={l.cta}
                      onChange={(e) => muda(l.chave, "cta", e.target.value)}
                    >
                      {[
                        "SHOP_NOW",
                        "BUY_NOW",
                        "ORDER_NOW",
                        "LEARN_MORE",
                        "GET_OFFER",
                        "SIGN_UP",
                        "SUBSCRIBE",
                      ].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </Td>
                  <Td className="min-w-[280px]">
                    <input
                      className={campo}
                      value={l.link}
                      onChange={(e) => muda(l.chave, "link", e.target.value)}
                    />
                  </Td>
                </tr>
              );
            })}
          </Table>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              disabled={
                !!v.comErro || !!v.erroLote || !linhas.length || etapa === "enviando" || lendo > 0
              }
              onClick={() => void enviarESalvar()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {etapa === "enviando"
                ? "Subindo arquivos…"
                : `Subir ${linhas.length} arquivo(s) e salvar no lote`}
            </button>
            {v.comErro > 0 && (
              <span className="text-sm text-destructive">
                Corrija os {v.comErro} criativo(s) com erro para continuar.
              </span>
            )}
          </div>
        </Panel>
      )}

      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
      {erro && <p className="text-sm text-destructive">{erro}</p>}

      {salvos > 0 && invalidosSalvos === 0 && (
        <Panel title="3. Confirmar envio ao Meta">
          <p className="mb-3 text-sm text-muted-foreground">
            Os {salvos} criativos vão para a biblioteca da conta <strong>{d.lote.conta}</strong>,
            página <strong>{d.lote.pageId}</strong>. Nenhum anúncio é criado e nada gasta verba. A
            confirmação fica registrada com seu e-mail. Para confirmar, digite o total de criativos.
          </p>
          <form
            className="flex max-w-md gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setErro(null);
              try {
                await fConfirmar({ data: { loteId: d.lote.id, totalDigitado: Number(digitado) } });
                qc.invalidateQueries({ queryKey: ["criativos-lote", d.lote.id] });
                qc.invalidateQueries({ queryKey: ["criativos-inicio"] });
              } catch (x) {
                setErro(x instanceof Error ? x.message : String(x));
              }
            }}
          >
            <input
              className={campo}
              inputMode="numeric"
              value={digitado}
              onChange={(e) => setDigitado(e.target.value)}
              placeholder={`digite ${salvos}`}
            />
            <button
              disabled={Number(digitado) !== salvos}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Confirmar e enviar
            </button>
          </form>
        </Panel>
      )}

      <button
        className="text-sm text-muted-foreground hover:text-destructive"
        onClick={async () => {
          await fCancelar({ data: { loteId: d.lote.id } });
          qc.invalidateQueries({ queryKey: ["criativos-lote", d.lote.id] });
          qc.invalidateQueries({ queryKey: ["criativos-inicio"] });
        }}
      >
        Cancelar lote
      </button>
    </div>
  );
}

function AplicaTodos({ rotulo, onAplicar }: { rotulo: string; onAplicar: (v: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div className="flex gap-2">
      <input
        className={campo}
        placeholder={rotulo}
        value={v}
        onChange={(e) => setV(e.target.value)}
      />
      <button
        className="rounded-md border border-border px-3 text-sm"
        onClick={() => v && onAplicar(v)}
      >
        Aplicar
      </button>
    </div>
  );
}

const STATUS_ITEM: Record<
  string,
  { rotulo: string; tom: "muted" | "primary" | "success" | "warn" | "danger" }
> = {
  validado: { rotulo: "validado", tom: "muted" },
  invalido: { rotulo: "inválido", tom: "danger" },
  na_fila: { rotulo: "na fila", tom: "muted" },
  enviando: { rotulo: "enviando", tom: "primary" },
  processando_video: { rotulo: "Meta processando vídeo", tom: "primary" },
  enviado: { rotulo: "criado no Meta", tom: "success" },
  erro: { rotulo: "erro", tom: "danger" },
  cancelado: { rotulo: "cancelado", tom: "muted" },
};

function Acompanhamento({ d }: { d: LoteD }) {
  const qc = useQueryClient();
  const fReenviar = useServerFn(reenviarErros);
  const fCancelar = useServerFn(cancelarLote);
  const cont = d.itens.reduce<Record<string, number>>(
    (m, i) => ((m[i.status] = (m[i.status] ?? 0) + 1), m),
    {},
  );
  const total = d.itens.length;
  const feitos = (cont["enviado"] ?? 0) + (cont["erro"] ?? 0) + (cont["cancelado"] ?? 0);
  const s = STATUS_LOTE[d.lote.status] ?? { rotulo: d.lote.status, tom: "muted" as const };
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["criativos-lote", d.lote.id] });
    qc.invalidateQueries({ queryKey: ["criativos-inicio"] });
  };
  return (
    <div className="space-y-6">
      <Panel title={`Lote: ${d.lote.nome}`} right={<StatusTag tone={s.tom}>{s.rotulo}</StatusTag>}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Kpi label="Criativos" value={fmtNum(total)} />
          <Kpi label="Criados no Meta" value={fmtNum(cont["enviado"] ?? 0)} tone="up" />
          <Kpi
            label="Na fila / processando"
            value={fmtNum(
              (cont["na_fila"] ?? 0) + (cont["enviando"] ?? 0) + (cont["processando_video"] ?? 0),
            )}
          />
          <Kpi
            label="Erros"
            value={fmtNum(cont["erro"] ?? 0)}
            {...((cont["erro"] ?? 0) ? { tone: "down" as const } : {})}
          />
          <Kpi
            label="Confirmado por"
            value={d.lote.confirmadoPor ?? "—"}
            hint={d.lote.confirmadoEm ? fmtDate(d.lote.confirmadoEm) : undefined}
          />
        </div>
        <div
          className="mt-4 h-2 w-full overflow-hidden rounded bg-muted"
          role="progressbar"
          aria-valuenow={feitos}
          aria-valuemax={total}
        >
          <div
            className="h-full bg-primary"
            style={{ width: `${total ? (feitos / total) * 100 : 0}%` }}
          />
        </div>
        <div className="mt-4 flex gap-4 text-sm">
          {(cont["erro"] ?? 0) > 0 && (
            <button
              className="font-medium text-primary hover:underline"
              onClick={async () => {
                await fReenviar({ data: { loteId: d.lote.id } });
                refresh();
              }}
            >
              Reenviar os {cont["erro"]} com erro
            </button>
          )}
          {["confirmado", "enviando"].includes(d.lote.status) && (
            <button
              className="text-muted-foreground hover:text-destructive"
              onClick={async () => {
                await fCancelar({ data: { loteId: d.lote.id } });
                refresh();
              }}
            >
              Parar o que ainda não foi enviado
            </button>
          )}
        </div>
      </Panel>
      <Panel title="Criativos">
        <Table head={["#", "Nome", "Arquivo", "Status", "ID no Meta", "Tentativas", "Último erro"]}>
          {d.itens.map((i) => {
            const st = STATUS_ITEM[i.status] ?? { rotulo: i.status, tom: "muted" as const };
            return (
              <tr key={i.id}>
                <Td mono>{i.ordem + 1}</Td>
                <Td className="max-w-[240px] truncate">{i.nome}</Td>
                <Td className="max-w-[180px] truncate">{i.arquivo}</Td>
                <Td>
                  <StatusTag tone={st.tom}>{st.rotulo}</StatusTag>
                </Td>
                <Td mono>{i.creativeId ?? "—"}</Td>
                <Td mono>{fmtNum(i.tentativas)}</Td>
                <Td className="max-w-[280px] text-xs text-destructive">
                  {i.ultimoErro ?? (i.erros.length ? i.erros.join("; ") : "")}
                </Td>
              </tr>
            );
          })}
        </Table>
      </Panel>
      <Panel title="Auditoria">
        {d.auditoria.length ? (
          <Table head={["Quando", "Quem", "Ação", "Detalhe"]}>
            {d.auditoria.map((a, k) => (
              <tr key={k}>
                <Td mono>{new Date(a.quando).toLocaleString("pt-BR")}</Td>
                <Td>{a.ator}</Td>
                <Td>{a.acao}</Td>
                <Td className="max-w-[360px] truncate font-mono text-xs">{a.detalhe}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty />
        )}
      </Panel>
    </div>
  );
}
