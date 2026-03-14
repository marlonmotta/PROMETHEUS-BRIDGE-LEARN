import { Link } from "react-router-dom";
import {
  Sparkles,
  Download,
  Brain,
  Users,
  Zap,
  BookOpen,
  Globe,
  Shield,
  ArrowRight,
} from "lucide-react";

export default function Landing() {
  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-linear-to-b from-accent/3 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-accent/8 rounded-full blur-[140px] pointer-events-none animate-fade-in" />
        {/* Secondary glow */}
        <div className="absolute top-40 left-1/4 w-[250px] h-[250px] bg-gold/3 rounded-full blur-[100px] pointer-events-none animate-fade-in delay-300" />

        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-36 text-center">
          {/* Badge */}
          <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium mb-8">
            <Sparkles size={13} />
            Open Source · Educação Adaptativa com IA
          </div>

          {/* Title */}
          <h1 className="animate-fade-up delay-100 text-4xl md:text-6xl lg:text-7xl font-bold text-txt leading-tight tracking-tight">
            A IA veste a máscara do{" "}
            <span className="bg-linear-to-r from-accent to-gold bg-clip-text text-transparent">
              universo que o aluno ama
            </span>
          </h1>

          <p className="animate-fade-up delay-200 mt-6 text-lg md:text-xl text-txt-2 max-w-2xl mx-auto leading-relaxed">
            Transforme qualquer conteúdo pedagógico usando personas como{" "}
            <strong className="text-gold">Jiraiya</strong>,{" "}
            <strong className="text-gold">Batman</strong> e{" "}
            <strong className="text-gold">Goku</strong>. A IA reescreve a
            matéria na voz do personagem que engaja o estudante.
          </p>

          {/* CTA */}
          <div className="animate-fade-up delay-300 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/app"
              className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-sm bg-accent text-white font-semibold text-base hover:bg-accent-2 transition-all animate-pulse-glow hover:shadow-[0_0_40px_rgba(139,92,246,0.4)]"
            >
              <Globe size={18} />
              Acessar Web App
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
            <a
              href="https://github.com/marlonmotta/PROMETHEUS-BRIDGE-LEARN/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-sm border border-border text-txt font-semibold text-base hover:bg-bg-3 hover:border-accent/30 transition-all"
            >
              <Download size={18} />
              Baixar Desktop
            </a>
          </div>

          {/* Stats */}
          <div className="animate-fade-up delay-400 mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 max-w-md mx-auto">
            {[
              { value: "50+", label: "Personas" },
              { value: "6", label: "Provedores IA" },
              { value: "5", label: "Formatos Export" },
            ].map((stat) => (
              <div key={stat.label} className="text-center group">
                <div className="text-2xl md:text-3xl font-bold text-accent group-hover:text-gold transition-colors">
                  {stat.value}
                </div>
                <div className="text-xs text-txt-3 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mockup Preview ─────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 -mt-4 mb-20 animate-scale-in delay-500">
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute -inset-2 bg-linear-to-r from-accent/20 via-gold/10 to-accent/20 rounded-lg blur-xl opacity-40 group-hover:opacity-80 transition-opacity duration-500" />
          <div className="relative rounded-lg overflow-hidden border border-border shadow-2xl shadow-accent/5">
            <img
              src="/mockup-desktop.webp"
              alt="Interface do PBL - Seleção de persona, entrada de conteúdo e resultado adaptado pela IA"
              className="w-full h-auto"
            />
            {/* Top reflection */}
            <div className="absolute inset-0 bg-linear-to-b from-white/2 to-transparent pointer-events-none" />
          </div>
        </div>
        <p className="text-center text-xs text-txt-3 mt-4 animate-fade-in delay-600">
          Interface do PBL - selecione a persona, cole o conteúdo, e veja a IA
          transformar o material
        </p>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-txt">
            Como funciona
          </h2>
          <p className="mt-3 text-txt-2 max-w-xl mx-auto">
            Uma plataforma pensada para professores que querem engajar alunos
            através do universo que eles já amam.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: <Users size={22} />,
              title: "Catálogo de Personas",
              desc: "Mais de 50 personas de anime, games, ciência e cultura pop. Cada uma com voz, pedagogia e prompts únicos.",
            },
            {
              icon: <Brain size={22} />,
              title: "IA Adaptativa",
              desc: "Suporte a OpenAI, Anthropic, Gemini, Groq, OpenRouter e Ollama (offline). Escolha o provedor que preferir.",
            },
            {
              icon: <Zap size={22} />,
              title: "Modo Manual",
              desc: "Não tem API key? O PBL gera o prompt perfeito para você colar em qualquer chat de IA.",
            },
            {
              icon: <BookOpen size={22} />,
              title: "Multi-formato",
              desc: "Exporte em TXT, Markdown, HTML, DOCX, e template de prova escolar pronto para imprimir.",
            },
            {
              icon: <Shield size={22} />,
              title: "Privacidade",
              desc: "Sua API key é armazenada localmente. Nenhum dado é enviado a servidores terceiros pelo PBL.",
            },
            {
              icon: <Globe size={22} />,
              title: "Web + Desktop",
              desc: "Use direto no navegador ou baixe o app desktop leve (~10MB). Mesmo código, mesma experiência.",
            },
          ].map((feature, i) => (
            <div
              key={feature.title}
              className={`group p-6 rounded-lg bg-bg-2 border border-border hover:border-accent/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.06)] hover:-translate-y-1`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-10 h-10 rounded-sm bg-accent/10 flex items-center justify-center text-accent mb-4 group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="text-base font-semibold text-txt mb-2 group-hover:text-accent transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-txt-2 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section className="bg-bg-2 border-y border-border">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-txt">
              3 passos para transformar o aprendizado
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Escolha a Persona",
                desc: "Selecione o personagem que mais engaja seu aluno. Jiraiya para Naruto fans, Batman para DC lovers, Tesla para curiosos de ciência.",
              },
              {
                step: "02",
                title: "Cole o Conteúdo",
                desc: "Insira a matéria - equações, verbos, fotossíntese - qualquer conteúdo pedagógico que queira adaptar.",
              },
              {
                step: "03",
                title: "Gere e Exporte",
                desc: "A IA reescreve tudo na voz da persona. Exporte como Word, PDF, ou Markdown para usar em sala de aula.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="text-center group p-6 rounded-lg border border-transparent hover:border-accent/10 hover:bg-accent/2 transition-all duration-300"
              >
                <div className="text-5xl font-bold text-accent/20 mb-4 group-hover:text-accent/40 transition-colors">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-txt mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-txt-2 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* CTA final */}
          <div className="mt-16 text-center">
            <Link
              to="/app"
              className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-sm bg-accent text-white font-semibold text-base hover:bg-accent-2 transition-all hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]"
            >
              <Sparkles size={18} />
              Começar agora - grátis
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
            <p className="mt-3 text-xs text-txt-3">
              Sem cadastro. Sem cartão. 100% gratuito e open source.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
