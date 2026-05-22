export function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-10 pb-16">

      {/* Page header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">How to Use</h1>
        <p className="text-sm text-slate-500 mt-1.5">
          A walkthrough of every feature — from adding your first snake to building multi-generation breeding trees.
        </p>
      </div>

      {/* ── Animals ─────────────────────────────────────────────── */}
      <Section emoji="🐍" title="Animals">
        <p>
          The <strong>Animals</strong> page is your personal roster of snakes. Every snake you save here
          can be quickly selected as a parent in the Calculator or as a mate when branching in the Playground.
        </p>

        <SubSection title="Adding an animal manually">
          <Steps>
            <Step n={1}>Open the <strong>Animals</strong> page and click <Kbd>+ Add Animal</Kbd>.</Step>
            <Step n={2}>Enter a name and use the gene picker to set the snake's genotype — click a gene to add one het copy, click again to make it visual/super.</Step>
            <Step n={3}>Click <Kbd>Save</Kbd>. The snake now appears in your roster and is available everywhere in the app.</Step>
          </Steps>
        </SubSection>

        <SubSection title="Importing from CLTCH or MorphMarket">
          <p className="text-slate-400 text-sm mb-3">
            If you manage your collection in <strong>CLTCH</strong> or list animals on <strong>MorphMarket</strong>,
            you can bulk-import your entire collection in seconds.
          </p>

          <div className="bg-[#161b27] border border-white/5 rounded-xl p-4 flex flex-col gap-2 mb-3">
            <p className="text-xs font-semibold text-slate-300">Exporting from CLTCH (formatted for MorphMarket)</p>
            <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1">
              <li>In CLTCH, go to your collection and choose <em>Export → MorphMarket CSV</em>.</li>
              <li>Save the <code className="bg-white/5 px-1 rounded">.csv</code> file to your device.</li>
            </ol>
          </div>

          <div className="bg-[#161b27] border border-white/5 rounded-xl p-4 flex flex-col gap-2">
            <p className="text-xs font-semibold text-slate-300">Importing the CSV</p>
            <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1">
              <li>On the <strong>Animals</strong> page click <Kbd>Import CSV</Kbd>.</li>
              <li>Either paste the CSV text directly or click <Kbd>Upload file</Kbd> to pick the file.</li>
              <li>
                The app automatically detects <strong>CLTCH</strong> and <strong>MorphMarket</strong> formats
                and parses each animal's traits into genotypes.
              </li>
              <li>Review the previewed animals. Any trait the app doesn't recognise is flagged in amber so you can check it manually.</li>
              <li>Click <Kbd>Save</Kbd> on individual animals, or <Kbd>Save all</Kbd> to import everything at once.</li>
            </ol>
          </div>

          <Note>
            Traits the importer can't match to a known gene are shown as "Unrecognized" — they won't affect the
            genotype but are displayed so nothing is lost.
          </Note>
        </SubSection>
      </Section>

      {/* ── Calculator ──────────────────────────────────────────── */}
      <Section emoji="🧬" title="Calculator">
        <p>
          The <strong>Calculator</strong> runs a live Punnett-square analysis for any two parents
          and shows every possible offspring outcome with its probability.
        </p>

        <SubSection title="Setting up a pairing">
          <Steps>
            <Step n={1}>
              Select genes for <strong>Sire (♂)</strong> and <strong>Dam (♀)</strong> using the gene pickers.
              Each picker shows your five most-recently used genes at the top for quick access.
            </Step>
            <Step n={2}>
              Results update instantly — no calculate button needed. Scroll the results panel to see
              every outcome grouped by probability.
            </Step>
            <Step n={3}>
              Click <Kbd>Load from saved</Kbd> (the import icon) on either parent to pull in a saved animal's
              genotype without retyping it.
            </Step>
          </Steps>
        </SubSection>

        <SubSection title="Reading results">
          <ul className="list-disc list-inside text-sm text-slate-400 space-y-1.5">
            <li>Each card shows the outcome label (e.g. <em>Pastel Het Clown</em>), its probability, and any interaction notes.</li>
            <li>Outcomes flagged <span className="text-red-400 font-medium">lethal</span> involve homozygous combinations known to be incompatible with life.</li>
            <li><span className="text-amber-400 font-medium">⚠ Risk notes</span> appear for genes with documented health concerns.</li>
            <li>BEL-complex genes automatically produce compound-het notes when multiple BEL morphs are present.</li>
          </ul>
        </SubSection>

        <SubSection title="Saving a pairing">
          <p className="text-slate-400 text-sm">
            Once you have a pairing you want to revisit, click <Kbd>Save Pairing</Kbd> in the top-right of the Calculator.
            Give it a name and it will appear on the <strong>Pairings</strong> page.
          </p>
        </SubSection>
      </Section>

      {/* ── Pairings ────────────────────────────────────────────── */}
      <Section emoji="⇄" title="Pairings">
        <p>
          The <strong>Pairings</strong> page stores named pairings you've created in the Calculator.
          Think of it as your breeding season plan.
        </p>

        <SubSection title="Managing pairings">
          <ul className="list-disc list-inside text-sm text-slate-400 space-y-1.5">
            <li>Click any saved pairing to reload it in the Calculator with both parents pre-filled.</li>
            <li>Use the edit icon to rename a pairing or update either parent's genotype.</li>
            <li>Delete pairings you no longer need with the trash icon.</li>
          </ul>
        </SubSection>

        <SubSection title="Launching the Playground">
          <p className="text-slate-400 text-sm">
            Every pairing card has an <Kbd>Open in Playground</Kbd> button. Clicking it creates a new
            Playground project rooted at that pairing — see the Playground section below.
          </p>
        </SubSection>
      </Section>

      {/* ── Playground ──────────────────────────────────────────── */}
      <Section emoji="🌿" title="Playground">
        <p>
          The <strong>Playground</strong> lets you build a multi-generation visual breeding tree.
          Starting from any pairing, you can branch offspring forward to see how traits carry through
          multiple generations.
        </p>

        <SubSection title="Starting a project">
          <Steps>
            <Step n={1}>From the <strong>Pairings</strong> page, click <Kbd>Open in Playground</Kbd> on any pairing.</Step>
            <Step n={2}>A new canvas opens with the root pairing displayed as the first node. All offspring outcomes are listed inside it.</Step>
            <Step n={3}>Click <Kbd>Save Project</Kbd> in the toolbar at any time to persist your tree.</Step>
          </Steps>
        </SubSection>

        <SubSection title="Branching an offspring">
          <Steps>
            <Step n={1}>Hover over any offspring row inside a pairing node — a <Kbd>+</Kbd> button appears on the right.</Step>
            <Step n={2}>Click <Kbd>+</Kbd> to open the <em>Pair offspring</em> dialog.</Step>
            <Step n={3}>
              Choose a mate from your <strong>Saved Animals</strong>, or create a <strong>New Animal</strong>
              inline by entering its name and selecting its genes.
            </Step>
            <Step n={4}>
              When you confirm with a new animal, it is automatically saved to your Animals roster
              so it can be referenced in future pairings.
            </Step>
            <Step n={5}>A new child node is added to the canvas connected by a branch edge showing the offspring's genotype and probability.</Step>
          </Steps>
          <Note>
            Offspring that have already been branched show a <span className="text-indigo-300 font-mono">↗</span> indicator
            instead of the <Kbd>+</Kbd> button — click the indicator to jump to the child node.
          </Note>
        </SubSection>

        <SubSection title="Navigating the canvas">
          <ul className="list-disc list-inside text-sm text-slate-400 space-y-1.5">
            <li><strong>Drag</strong> any node to rearrange the layout.</li>
            <li><strong>Scroll</strong> to zoom in and out.</li>
            <li>Use the <strong>mini-map</strong> (bottom-right) to orient yourself in large trees.</li>
            <li>The <strong>Controls</strong> toolbar (bottom-left) has fit-view and zoom buttons.</li>
            <li>Right-click a branch edge or node for removal options.</li>
          </ul>
        </SubSection>
      </Section>

    </div>
  );
}

// ── Internal layout components ───────────────────────────────────────────────

function Section({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center gap-3 border-b border-white/5 pb-3">
        <span className="text-2xl">{emoji}</span>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <div className="flex flex-col gap-5 text-sm text-slate-400 leading-relaxed pl-1">
        {children}
      </div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
      {children}
    </div>
  );
}

function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="flex flex-col gap-2">{children}</ol>;
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm text-slate-400">
      <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center px-1.5 py-0.5 rounded bg-white/[0.07] border border-white/10 text-slate-200 text-[11px] font-medium not-italic">
      {children}
    </kbd>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 bg-amber-900/10 border border-amber-700/20 rounded-xl px-3 py-2.5 mt-1">
      <span className="text-amber-400 shrink-0 mt-0.5">💡</span>
      <p className="text-xs text-amber-300/80 leading-relaxed">{children}</p>
    </div>
  );
}
