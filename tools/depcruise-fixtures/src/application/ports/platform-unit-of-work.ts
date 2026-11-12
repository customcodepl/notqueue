// The platform port; only the platform module and the composition root may use it.
export type PlatformUnitOfWork = () => { readonly kind: "tx" };
