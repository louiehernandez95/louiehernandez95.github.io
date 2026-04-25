export interface IPokemonStats {
  hp: number;
  attack: number;
  defense: number;
  special_attack: number;
  special_defense: number;
  speed: number;
}

export interface IPokemon {
  id: number;
  name: string;
  category: string;
  generation: string;
  is_legendary: boolean;
  is_mythical: boolean;
  types: string[];
  height: number;
  weight: number;
  habitat: string;
  evolves_from: string;
  description: string;
  stats: IPokemonStats;
  sprite_url: string;
  shiny_sprite_url: string;
}

export interface ITypeSummary {
  type: string;
  count: number;
  averageAttack: number;
  averageSpeed: number;
  averageDefense: number;
}
