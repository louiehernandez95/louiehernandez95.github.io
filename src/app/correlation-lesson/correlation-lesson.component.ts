import { Component, OnInit } from '@angular/core';
import { IPokemon } from '../models/pokemon.model';
import { DataService } from '../services/data.service';

interface CorrelationCard {
  title: string;
  question: string;
  matchScore: number;
  answer: string;
  joke: string;
}

@Component({
  selector: 'app-correlation-lesson',
  templateUrl: './correlation-lesson.component.html',
  styleUrls: ['./correlation-lesson.component.scss']
})
export class CorrelationLessonComponent implements OnInit {
  pokemonCount = 0;
  cards: CorrelationCard[] = [];
  strongest: CorrelationCard | null = null;
  tinyRuleBreaker = '';

  constructor(private data: DataService) { }

  ngOnInit(): void {
    const pokemon = this.data.allData;
    this.pokemonCount = pokemon.length;
    this.cards = this.buildCards(pokemon);
    this.strongest = [...this.cards].sort((a, b) => b.matchScore - a.matchScore)[0] || null;
    this.tinyRuleBreaker = this.findTinyRuleBreaker(pokemon);
  }

  getMatchWidth(score: number): string {
    return `${Math.max(8, score)}%`;
  }

  private buildCards(pokemon: IPokemon[]): CorrelationCard[] {
    return [
      this.makeCard(
        'Heavy vs. Attack',
        'Do heavier Pokémon usually hit harder?',
        pokemon.map((p) => p.weight),
        pokemon.map((p) => p.stats.attack),
        'There is a real pattern here: heavier Pokémon often have higher attack.',
        'But a dumbbell does not automatically know karate.'
      ),
      this.makeCard(
        'Tall vs. Speed',
        'Do taller Pokémon usually move faster?',
        pokemon.map((p) => p.height),
        pokemon.map((p) => p.stats.speed),
        'This pattern is weaker. Tall Pokémon are not always zoomy.',
        'Long legs help, unless you are shaped like a refrigerator.'
      ),
      this.makeCard(
        'Defense vs. Speed',
        'Are tanky Pokémon slower?',
        pokemon.map((p) => p.stats.defense),
        pokemon.map((p) => p.stats.speed),
        'This checks whether high defense and high speed travel together.',
        'Sometimes armor is cool. Sometimes armor is a backpack full of bricks.'
      ),
      this.makeCard(
        'HP vs. Weight',
        'Do heavier Pokémon usually have more HP?',
        pokemon.map((p) => p.weight),
        pokemon.map((p) => p.stats.hp),
        'This is another place where size often matters, but only as a clue.',
        'Being large may help you take hits, but it does not make you emotionally ready for math class.'
      )
    ];
  }

  private makeCard(title: string, question: string, left: number[], right: number[], answer: string, joke: string): CorrelationCard {
    const score = Math.round(Math.abs(this.correlation(left, right)) * 100);
    return { title, question, matchScore: score, answer, joke };
  }

  private findTinyRuleBreaker(pokemon: IPokemon[]): string {
    const tinyStrong = pokemon
      .filter((p) => p.weight < 10)
      .sort((a, b) => b.stats.attack - a.stats.attack)[0];

    return tinyStrong ? `${this.titleCase(tinyStrong.name)} weighs under 10 but has ${tinyStrong.stats.attack} attack.` : '';
  }

  private correlation(left: number[], right: number[]): number {
    const leftAverage = this.average(left);
    const rightAverage = this.average(right);
    let top = 0;
    let leftBottom = 0;
    let rightBottom = 0;

    for (let i = 0; i < left.length; i++) {
      const leftDistance = left[i] - leftAverage;
      const rightDistance = right[i] - rightAverage;
      top += leftDistance * rightDistance;
      leftBottom += leftDistance * leftDistance;
      rightBottom += rightDistance * rightDistance;
    }

    const bottom = Math.sqrt(leftBottom * rightBottom);
    return bottom === 0 ? 0 : top / bottom;
  }

  private average(values: number[]): number {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private titleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.substring(1).replace('-', ' ');
  }
}
