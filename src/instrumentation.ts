export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { iniciarLoopDeCaptura } = await import("~/server/email/captura-curriculos-loop");
  iniciarLoopDeCaptura();
}
