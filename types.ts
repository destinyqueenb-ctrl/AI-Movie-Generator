
export interface Scene {
  id?: string;
  title: string;
  description: string;
  dialogue: string;
  imagePrompt: string;
}

export interface MovieScript {
  title: string;
  genre: string;
  scenes: Scene[];
}
