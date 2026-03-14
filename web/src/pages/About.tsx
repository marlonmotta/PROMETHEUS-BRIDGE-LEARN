import { Link } from "react-router-dom";
import {
  Github,
  BookOpen,
  Users,
  Heart,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      {/* Header */}
      <div className="mb-16 animate-fade-up">
        <h1 className="text-3xl md:text-5xl font-bold text-txt leading-tight">
          Sobre o{" "}
          <span className="bg-linear-to-r from-accent to-gold bg-clip-text text-transparent">
            PBL
          </span>
        </h1>
        <p className="mt-4 text-lg text-txt-2 leading-relaxed max-w-2xl">
          PROMETHEUS · BRIDGE · LEARN é uma plataforma open source que usa
          inteligência artificial para transformar como estudantes se conectam
          com o conteúdo pedagógico.
        </p>
      </div>

      {/* Filosofia */}
      <section className="mb-16 animate-fade-up delay-100">
        <h2 className="text-xl font-bold text-txt mb-4 flex items-center gap-2">
          <Heart size={20} className="text-accent" />
          Filosofia
        </h2>
        <div className="bg-bg-2 border border-border rounded-lg p-6 hover:border-accent/20 transition-colors">
          <blockquote className="text-lg text-txt-2 italic border-l-3 border-accent pl-4">
            "A IA veste a máscara do universo que o aluno ama - e reescreve a
            educação pelo canal dele."
          </blockquote>
          <p className="mt-4 text-sm text-txt-2 leading-relaxed">
            O sistema opera no princípio de que cada estudante tem interesses
            intensos - seu hiperfoco. Quando a matéria é recontextualizada nesse
            universo (seja Naruto, Batman, ou Física Quântica), o engajamento e
            a retenção aumentam drasticamente. Isso é especialmente eficaz para
            alunos neurodivergentes (TDAH, TEA), mas beneficia todos.
          </p>
        </div>
      </section>

      {/* Arquitetura */}
      <section className="mb-16 animate-fade-up delay-200">
        <h2 className="text-xl font-bold text-txt mb-4 flex items-center gap-2">
          <BookOpen size={20} className="text-accent" />
          Arquitetura de 3 Camadas
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              icon: <Sparkles size={24} className="text-accent" />,
              title: "Personas",
              desc: "JSONs estruturados que definem identidade, voz, pedagogia e o 'Cognitive Bridge' de cada personagem.",
              gradient: "from-accent/10 to-transparent",
            },
            {
              icon: <BookOpen size={24} className="text-gold" />,
              title: "Interface",
              desc: "App web e desktop para professores gerenciarem alunos, personas e geração de conteúdo adaptado.",
              gradient: "from-gold/10 to-transparent",
            },
            {
              icon: <ExternalLink size={24} className="text-ok" />,
              title: "Bridge",
              desc: "A conexão onde o conteúdo é reescrito por um LLM (Ollama ou APIs Cloud) guiado pelas instruções da Persona.",
              gradient: "from-ok/10 to-transparent",
            },
          ].map((layer) => (
            <div
              key={layer.title}
              className="group bg-bg-2 border border-border rounded-lg p-5 hover:border-accent/20 hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className={`w-10 h-10 rounded-sm bg-linear-to-br ${layer.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
              >
                {layer.icon}
              </div>
              <h3 className="text-sm font-semibold text-txt mb-1.5 group-hover:text-accent transition-colors">
                {layer.title}
              </h3>
              <p className="text-xs text-txt-2 leading-relaxed">{layer.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="mb-16 animate-fade-up delay-300">
        <h2 className="text-xl font-bold text-txt mb-4 flex items-center gap-2">
          <Sparkles size={20} className="text-accent" />
          Stack Tecnológica
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "React", detail: "Interface" },
            { label: "TypeScript", detail: "Tipagem" },
            { label: "Tauri 2", detail: "Desktop" },
            { label: "Vite", detail: "Web Build" },
            { label: "Tailwind", detail: "Estilos" },
            { label: "Ollama", detail: "IA Local" },
            { label: "5 APIs Cloud", detail: "IA Online" },
            { label: "MIT", detail: "Licença" },
          ].map((tech) => (
            <div
              key={tech.label}
              className="bg-bg-2 border border-border rounded-lg p-3.5 text-center hover:border-accent/20 transition-colors group"
            >
              <div className="text-sm font-semibold text-txt group-hover:text-accent transition-colors">
                {tech.label}
              </div>
              <div className="text-[10px] text-txt-3 mt-0.5">{tech.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Contribuir */}
      <section className="mb-16 animate-fade-up delay-400">
        <h2 className="text-xl font-bold text-txt mb-4 flex items-center gap-2">
          <Users size={20} className="text-accent" />
          Contribua
        </h2>
        <div className="bg-bg-2 border border-border rounded-lg p-6 hover:border-accent/20 transition-colors">
          <p className="text-sm text-txt-2 leading-relaxed mb-5">
            PBL é 100% open source e aceita contribuições de todos os tipos:
            novas personas, melhorias na interface, traduções, correções de
            bugs, sugestões de features, ou simplesmente uma ⭐ no GitHub.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://github.com/marlonmotta/PROMETHEUS-BRIDGE-LEARN"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-bg-3 border border-border text-txt text-sm font-medium hover:border-accent/30 hover:bg-bg-3 transition-all"
            >
              <Github size={16} />
              Ver no GitHub
              <ArrowRight
                size={14}
                className="group-hover:translate-x-1 transition-transform"
              />
            </a>
            <Link
              to="/app"
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-accent text-white text-sm font-medium hover:bg-accent-2 transition-colors"
            >
              Experimentar o App
              <ArrowRight
                size={14}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
