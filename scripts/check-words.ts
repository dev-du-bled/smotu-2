// Vérifie que chaque mot-réponse (WORDS_BY_LENGTH) existe bien dans le
// dictionnaire des mots acceptés (VALID_WORDS_BY_LENGTH). Un mot-réponse absent
// du dictionnaire est indevinable : la saisie du joueur serait refusée.
// Usage : `bun scripts/check-words.ts`.
import { WORDS_BY_LENGTH, WORD_LENGTH_OPTIONS } from "../shared/game";
import { VALID_WORDS_BY_LENGTH } from "../shared/word-bank";

let hasError = false;

for (const length of WORD_LENGTH_OPTIONS) {
  const answers = WORDS_BY_LENGTH[length];
  const valid = new Set(VALID_WORDS_BY_LENGTH[length]);
  const missing = answers.filter((word) => !valid.has(word));

  console.log(`${length} lettres : ${answers.length} mots-réponses.`);

  if (missing.length > 0) {
    hasError = true;
    console.error(
      `  ${missing.length} mot(s) absent(s) du dictionnaire : ${missing.join(", ")}`,
    );
  }
}

if (hasError) {
  console.error("\nÉchec : des mots-réponses sont indevinables.");
  process.exit(1);
}

console.log("\nSuccès : tous les mots-réponses sont valides.");
