export interface ContainerSpec {
  image: string;
  network: "none";
  readOnlyRoot: boolean;
  mounts: string[];
}

/** Contract only: this process does not start a container. */
export function sandboxContainer(image = "node:22-alpine"): ContainerSpec {
  return { image, network: "none", readOnlyRoot: true, mounts: ["sandbox"] };
}
