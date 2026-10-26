import type { ResourceType } from "@prisma/client";

export const RESOURCE_META: Record<
  ResourceType,
  { label: string; plural: string; accent: string; chip: string }
> = {
  LIVRO: { label: "Livro", plural: "Livros", accent: "from-[#1B2C55] to-[#2B57B0]", chip: "bg-blue/10 text-blue" },
  PODCAST: { label: "Podcast", plural: "Podcasts", accent: "from-[#4C1D95] to-[#7C3AED]", chip: "bg-purple/10 text-purple" },
  VIDEO: { label: "Vídeo", plural: "Vídeos", accent: "from-[#7F1D1D] to-[#DC2626]", chip: "bg-danger-soft text-danger" },
  CURSO: { label: "Curso", plural: "Cursos", accent: "from-[#14532D] to-[#16A34A]", chip: "bg-success-soft text-success" },
  ARTIGO: { label: "Artigo", plural: "Artigos", accent: "from-[#78350F] to-[#D97706]", chip: "bg-warn-soft text-warn" },
  FERRAMENTA: { label: "Ferramenta", plural: "Ferramentas", accent: "from-[#0B1B3A] to-[#1E3358]", chip: "bg-deep/10 text-deep" },
  OUTRO: { label: "Outro", plural: "Outros", accent: "from-[#334155] to-[#64748B]", chip: "bg-bg text-muted" },
};

export const RESOURCE_TYPE_ORDER = Object.keys(RESOURCE_META) as ResourceType[];
