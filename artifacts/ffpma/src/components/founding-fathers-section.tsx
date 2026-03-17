import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Shield, Scale, Scroll, BookOpen } from "lucide-react";

const founders = [
  {
    name: "George Washington",
    image: "/assets/founding-fathers/washington.png",
    quote: "If the freedom of speech is taken away then dumb and silent we may be led, like sheep to the slaughter.",
    amendment: "Commander of Liberty",
  },
  {
    name: "Benjamin Franklin",
    image: "/assets/founding-fathers/franklin.png",
    quote: "Those who would give up essential Liberty, to purchase a little temporary Safety, deserve neither.",
    amendment: "Voice of Wisdom",
  },
  {
    name: "Thomas Jefferson",
    image: "/assets/founding-fathers/jefferson.png",
    quote: "If people let the government decide what foods they eat and what medicines they take, their bodies will soon be in as sorry a state as the souls under tyranny.",
    amendment: "Author of Freedom",
  },
  {
    name: "James Madison",
    image: "/assets/founding-fathers/madison.png",
    quote: "The advancement and diffusion of knowledge is the only guardian of true liberty.",
    amendment: "Father of the Constitution",
  },
  {
    name: "John Adams",
    image: "/assets/founding-fathers/adams.png",
    quote: "Liberty cannot be preserved without a general knowledge among the people.",
    amendment: "Champion of Rights",
  },
];

const constitutionalPillars = [
  {
    icon: Shield,
    title: "1st Amendment",
    description: "Freedom of association and the right to assemble privately for mutual benefit.",
  },
  {
    icon: Scale,
    title: "14th Amendment",
    description: "Due process and equal protection under law for all private member agreements.",
  },
  {
    icon: Scroll,
    title: "Right to Contract",
    description: "Members freely contract with each other in the private domain, beyond regulatory reach.",
  },
  {
    icon: BookOpen,
    title: "Case Law Precedent",
    description: "NAACP v. Alabama, Roberts v. Jaycees, and Boy Scouts v. Dale affirm our rights.",
  },
];

export function FoundingFathersSection() {
  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0E1A] via-[#1A2440] to-[#0A0E1A]" />
      <div className="absolute inset-0 bg-[url('/assets/founding-fathers/founders-banner.png')] bg-cover bg-center opacity-[0.07]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A] via-transparent to-[#0A0E1A]" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Badge className="mb-4 bg-[#C9A54E]/20 border-[#C9A54E]/40 text-[#C9A54E] hover:bg-[#C9A54E]/30 cursor-default">
            <Shield className="mr-2 h-4 w-4" />
            Constitutional Foundation
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-[#C9A54E] via-amber-300 to-[#C9A54E] bg-clip-text text-transparent">
              Built on the Shoulders of Giants
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-gray-400 text-lg">
            The Founding Fathers fought for the freedoms we exercise today. 
            Our Private Member Association stands on the constitutional rights they secured — 
            the freedom to associate, to contract privately, and to choose our own path to wellness.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-16">
          {founders.map((founder, index) => (
            <motion.div
              key={founder.name}
              className="group relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="relative overflow-hidden rounded-2xl border border-[#C9A54E]/20 bg-gradient-to-b from-[#243055]/80 to-[#1A2440]/80 backdrop-blur-sm group-hover:border-[#C9A54E]/50 transition-all duration-500 group-hover:shadow-lg group-hover:shadow-[#C9A54E]/10">
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={founder.image}
                    alt={founder.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A] via-transparent to-transparent opacity-80" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-sm md:text-base font-bold text-white mb-0.5">{founder.name}</h3>
                  <p className="text-xs text-[#C9A54E] font-medium">{founder.amendment}</p>
                </div>
                <div className="absolute inset-0 bg-[#0A0E1A]/90 flex items-center justify-center p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <p className="text-xs md:text-sm text-gray-300 italic text-center leading-relaxed">
                    "{founder.quote}"
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {constitutionalPillars.map((pillar, index) => (
            <div
              key={pillar.title}
              className="rounded-xl border border-[#C9A54E]/20 bg-[#243055]/40 backdrop-blur-sm p-5 hover:border-[#C9A54E]/40 transition-all duration-300 hover:bg-[#243055]/60"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#C9A54E]/10 border border-[#C9A54E]/20">
                  <pillar.icon className="h-5 w-5 text-[#C9A54E]" />
                </div>
                <h3 className="font-bold text-white text-sm">{pillar.title}</h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{pillar.description}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <p className="text-sm text-[#C9A54E]/60 italic max-w-xl mx-auto">
            "We hold these truths to be self-evident, that all men are created equal, that they are endowed by their Creator with certain unalienable Rights, that among these are Life, Liberty and the pursuit of Happiness."
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export function FoundingFathersAboutSection() {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Our Constitutional Heritage</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          The freedoms our Founding Fathers fought for are the very foundation upon which 
          Forgotten Formula PMA operates.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-[#C9A54E]/20 bg-gradient-to-br from-[#1A2440] to-[#0A0E1A] p-8">
        <div className="absolute inset-0 bg-[url('/assets/founding-fathers/founders-banner.png')] bg-cover bg-center opacity-[0.05]" />
        <div className="relative z-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {founders.map((founder) => (
              <div key={founder.name} className="text-center">
                <div className="relative overflow-hidden rounded-xl border border-[#C9A54E]/20 mb-2 aspect-[3/4]">
                  <img
                    src={founder.image}
                    alt={founder.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A] via-transparent to-transparent opacity-60" />
                </div>
                <p className="text-xs font-semibold text-white">{founder.name}</p>
                <p className="text-[10px] text-[#C9A54E]">{founder.amendment}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {constitutionalPillars.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-lg border border-[#C9A54E]/15 bg-[#243055]/30 p-3 text-center"
              >
                <pillar.icon className="h-5 w-5 text-[#C9A54E] mx-auto mb-2" />
                <h4 className="text-xs font-bold text-white mb-1">{pillar.title}</h4>
                <p className="text-[10px] text-gray-400 leading-relaxed">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <blockquote className="text-center italic text-muted-foreground text-sm border-l-2 border-[#C9A54E]/40 pl-4 mx-auto max-w-lg">
        "If people let the government decide what foods they eat and what medicines they take, 
        their bodies will soon be in as sorry a state as the souls under tyranny."
        <span className="block mt-2 not-italic font-semibold text-foreground text-xs">— Thomas Jefferson</span>
      </blockquote>
    </div>
  );
}
