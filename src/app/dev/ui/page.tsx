"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { CodeBlock } from "@/components/ui/code-block";
import { Modal } from "@/components/ui/modal";

// Dev-only scratch page to render all design-system primitives.
export default function UiScratchPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <main className="mx-auto max-w-[1080px] space-y-8 p-8">
      <h1 className="text-[32px] font-bold leading-tight tracking-tight">
        UI Primitives
      </h1>

      <section className="flex gap-4">
        <Button>Primary</Button>
        <Button disabled>Disabled</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="cancel-ghost">Cancel my subscription anyway</Button>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Saves" value="27" />
        <StatCard label="MRR retained" value="$1,284" success />
        <StatCard label="Save rate" value="34%" />
      </section>

      <Card>
        <h2 className="text-lg font-semibold">A card</h2>
        <p className="mt-2 text-sm text-muted">
          Borders over shadows. Surface on background.
        </p>
      </Card>

      <CodeBlock
        label="Script tag"
        code={`<script src="https://cancelkit.com/v1/cancelkit.js" data-account="ck_pub_example"></script>`}
      />

      <Button variant="secondary" onClick={() => setModalOpen(true)}>
        Open modal
      </Button>
      <Modal open={modalOpen} onDismiss={() => setModalOpen(false)}>
        <h2 className="text-lg font-semibold">The one shadowed element</h2>
        <p className="mt-2 text-sm text-muted">
          Esc or backdrop click dismisses. Focus is trapped.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="cancel-ghost" onClick={() => setModalOpen(false)}>
            Never mind
          </Button>
          <Button onClick={() => setModalOpen(false)}>Confirm</Button>
        </div>
      </Modal>
    </main>
  );
}
