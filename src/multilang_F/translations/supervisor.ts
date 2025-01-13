export const locale: Record<string, Record<string, string>> = {
    "You are a planner that breaks down complex workflows into smaller, actionable steps.\nYour job is to determine the next task that needs to be done based on the <workflow> and what has been completed so far.\n\nRules:\n1. Each task should be self-contained and achievable\n2. Tasks should be specific and actionable\n3. Return null when the workflow is complete\n4. Consider dependencies and order of operations\n5. Use context from completed tasks to inform next steps.": {
      "en": "You are a planner that breaks down complex workflows into smaller, actionable steps.\nYour job is to determine the next task that needs to be done based on the <workflow> and what has been completed so far.\n\nRules:\n1. Each task should be self-contained and achievable\n2. Tasks should be specific and actionable\n3. Return null when the workflow is complete\n4. Consider dependencies and order of operations\n5. Use context from completed tasks to inform next steps.",
      "pl": "Jesteś planistą, który dzieli złożone workflow na mniejsze, wykonalne kroki.\nTwoim zadaniem jest ustalenie następnego zadania na podstawie <workflow> i tego, co zostało dotychczas wykonane.\n\nZasady:\n1. Każde zadanie powinno być niezależne i wykonalne\n2. Zadania powinny być konkretne i możliwe do wykonania\n3. Zwróć null, gdy workflow jest ukończony\n4. Uwzględnij zależności i kolejność działań\n5. Używaj kontekstu z ukończonych zadań.",
      "de": "Sie sind ein Planer, der komplexe Arbeitsabläufe in kleinere, umsetzbare Schritte unterteilt.\nIhre Aufgabe besteht darin, die nächste Aufgabe basierend auf dem <workflow> und dem, was bisher abgeschlossen wurde, zu bestimmen.\n\nRegeln:\n1. Jede Aufgabe sollte eigenständig und erreichbar sein\n2. Aufgaben sollten spezifisch und umsetzbar sein\n3. Geben Sie null zurück, wenn der Arbeitsablauf abgeschlossen ist\n4. Berücksichtigen Sie Abhängigkeiten und Reihenfolgen\n5. Nutzen Sie den Kontext abgeschlossener Aufgaben, um die nächsten Schritte zu bestimmen."
    },
    "What is the request?": {
      "en": "What is the request?",
      "pl": "Jakie jest zadanie?",
      "de": "Was ist die Anfrage?"
    },
    "What has been completed so far?": {
      "en": "What has been completed so far?",
      "pl": "Co zostało dotychczas wykonane?",
      "de": "Was wurde bisher erledigt?"
    },
    "The next task to be completed, or empty string if workflow is complete": {
      "en": "The next task to be completed, or empty string if workflow is complete",
      "pl": "Następne zadanie do wykonania lub pusty ciąg, jeśli workflow jest ukończony",
      "de": "Die nächste zu erledigende Aufgabe oder ein leerer String, wenn der Workflow abgeschlossen ist"
    },
    "The reasoning for selecting the next task or why the workflow is complete": {
      "en": "The reasoning for selecting the next task or why the workflow is complete",
      "pl": "Uzasadnienie wyboru następnego zadania lub dlaczego workflow jest ukończony.",
      "de": "Die Begründung für die Auswahl der nächsten Aufgabe oder warum der Workflow abgeschlossen ist."
    }
  };
  