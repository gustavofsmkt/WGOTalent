import { notFound } from "next/navigation";

import { triagemRepository } from "~/server/db/repositories/triagem";
import { uuidSchema } from "~/lib/validation/common";
import { TriagemDetailEditor } from "./_components/triagem-detail-editor";

export const dynamic = "force-dynamic";

export default async function TriagemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) {
    notFound();
  }

  const triagem = await triagemRepository.findByIdWithJoins(id);

  if (!triagem) {
    notFound();
  }

  return <TriagemDetailEditor triagem={triagem} key={triagem.updatedAt} />;
}
