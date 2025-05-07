// src/services/gemini/schema-instruction.ts
/**
 * Moduł generujący precyzyjne instrukcje dla modelu LLM na podstawie schematu JSON
 * z dodaniem instrukcji do wiadomości użytkownika zamiast wiadomości systemowej
 */

// Typy dla schematu JSON
type JsonSchemaProperty = {
    type: string;
    description?: string;
    title?: string;
    properties?: Record<string, JsonSchemaProperty>;
    items?: JsonSchemaProperty;
    required?: string[];
    [key: string]: any;
  };
  
  interface JsonSchema {
    type: string;
    properties?: Record<string, JsonSchemaProperty>;
    required?: string[];
    [key: string]: any;
  }
  
  /**
   * Generuje przykładową wartość dla danego typu
   */
  function generateExampleValue(property: JsonSchemaProperty): any {
    switch (property.type) {
      case 'string':
        if (property.title?.toLowerCase().includes('id')) {
          return "id-example-123";
        }
        return property.example || 
               property.title || 
               property.description || 
               "Example value";
      case 'number':
        return property.example || 42;
      case 'integer':
        return property.example || 42;
      case 'boolean':
        return property.example || true;
      case 'array':
        if (property.items) {
          return [generateExampleValue(property.items)];
        }
        return [];
      case 'object':
        if (property.properties) {
          const example: Record<string, any> = {};
          for (const [key, prop] of Object.entries(property.properties)) {
            example[key] = generateExampleValue(prop);
          }
          return example;
        }
        return {};
      default:
        return null;
    }
  }
  
  /**
   * Generuje przykładowy obiekt na podstawie schematu JSON
   */
  function generateExampleObject(schema: JsonSchema): any {
    if (schema.type !== 'object' || !schema.properties) {
      return {};
    }
  
    const example: Record<string, any> = {};
    for (const [key, property] of Object.entries(schema.properties)) {
      example[key] = generateExampleValue(property);
    }
    return example;
  }
  
  /**
   * Generuje szczegółowy opis struktury pola
   */
  function generateFieldDescription(
    property: JsonSchemaProperty, 
    name: string, 
    isRequired: boolean,
    indentation: number = 0
  ): string {
    const indent = '  '.repeat(indentation);
    const requiredMark = isRequired ? ' (WYMAGANE)' : ' (opcjonalne)';
    const description = property.description 
      ? ` - ${property.description}` 
      : '';
    
    let result = `${indent}- "${name}": ${property.type}${requiredMark}${description}\n`;
    
    if (property.type === 'object' && property.properties) {
      result += `${indent}  Zawiera następujące pola:\n`;
      for (const [key, prop] of Object.entries(property.properties)) {
        const isChildRequired = (property.required || []).includes(key);
        result += generateFieldDescription(prop, key, isChildRequired, indentation + 2);
      }
    } else if (property.type === 'array' && property.items) {
      result += `${indent}  Każdy element tablicy to: ${property.items.type}\n`;
      if (property.items.type === 'object' && property.items.properties) {
        result += `${indent}  Każdy element zawiera:\n`;
        for (const [key, prop] of Object.entries(property.items.properties)) {
          const isChildRequired = (property.items.required || []).includes(key);
          result += generateFieldDescription(prop, key, isChildRequired, indentation + 2);
        }
      }
    }
    
    return result;
  }
  
  /**
   * Generuje szczegółowy opis struktury schematu
   */
  function generateSchemaDescription(schema: JsonSchema): string {
    if (schema.type !== 'object' || !schema.properties) {
      return 'Schemat nie zawiera właściwości obiektu.';
    }
    
    let description = 'Zwróć JSON z DOKŁADNIE następującą strukturą:\n';
    for (const [key, property] of Object.entries(schema.properties)) {
      const isRequired = (schema.required || []).includes(key);
      description += generateFieldDescription(property, key, isRequired);
    }
    
    return description;
  }
  
  /**
   * Generuje listę kluczy JSON, które muszą pozostać niezmienione
   */
  function generateJsonKeysListing(schema: JsonSchema): string {
    const allKeys: string[] = [];
    
    function collectKeys(obj: any, prefix = ''): void {
      if (!obj || typeof obj !== 'object') return;
      
      if (obj.type === 'object' && obj.properties) {
        for (const [key, prop] of Object.entries(obj.properties)) {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          allKeys.push(fullKey);
          collectKeys(prop, fullKey);
        }
      } else if (obj.type === 'array' && obj.items && obj.items.properties) {
        for (const [key, prop] of Object.entries(obj.items.properties)) {
          const fullKey = prefix ? `${prefix}[].${key}` : `[].${key}`;
          allKeys.push(fullKey);
          collectKeys(prop, fullKey);
        }
      }
    }
    
    collectKeys(schema);
    
    if (allKeys.length === 0) return '';
    
    return `
  NAZWY KLUCZY, KTÓRE MUSZĄ POZOSTAĆ DOKŁADNIE TAKIE SAME (NIE TŁUMACZYĆ NA INNY JĘZYK):
  ${allKeys.map(key => `- "${key}"`).join('\n')}
  `;
  }
  
  /**
   * Generuje instrukcję dla modelu na podstawie schematu JSON
   */
  function generateInstructions(schema: JsonSchema): string {
    const schemaDescription = generateSchemaDescription(schema);
    const exampleObject = generateExampleObject(schema);
    const keysListing = generateJsonKeysListing(schema);
    
    return `
  ########## INSTRUKCJE FORMATU ODPOWIEDZI ##########
  
  ${schemaDescription}
  
  ${keysListing}
  
  Oto przykład dokładnej struktury, której oczekuję (ZASTĄP WARTOŚCI swoimi, ale ZACHOWAJ IDENTYCZNE NAZWY PÓL):
  ${JSON.stringify(exampleObject, null, 2)}
  
  ABSOLUTNIE KLUCZOWE WYMAGANIA:
  1. Twoja odpowiedź MUSI zawierać TYLKO obiekt JSON bez żadnego tekstu przed lub po nim.
  2. Struktura JSON MUSI być IDENTYCZNA z przedstawioną powyżej - te same nazwy pól, zagnieżdżenia i typy danych.
  3. Wszystkie pola oznaczone jako WYMAGANE muszą być obecne.
  4. NIE ZMIENIAJ NAZW PÓL - NIE TŁUMACZ ICH NA POLSKI ANI INNY JĘZYK - użyj dokładnie tych samych nazw pól, jakie podano.
  5. Treść odpowiedzi (wartości pól) może być w języku polskim.
  6. NIE dodawaj żadnych dodatkowych pól, których nie ma w powyższej strukturze.
  7. NIE używaj dodatkowych zagnieżdżeń, których nie ma w pokazanej strukturze.
  
  ##################################################
  
  `;
  }
  
  /**
   * Funkcja publiczna modułu - wzbogaca wiadomości o instrukcje z schematu
   * KGF: W przeciwieństwie do poprzedniej wersji, teraz dodajemy instrukcje do
   * wiadomości użytkownika zamiast wiadomości systemowej
   */
  export function enhanceMessagesWithSchemaInstructions(
    messages: any[],
    schema: JsonSchema
  ): any[] {
    if (!schema) {
      return messages;
    }
    
    const instructions = generateInstructions(schema);
    const enhancedMessages = [...messages];
    
    // Znajdź ostatnią wiadomość użytkownika
    for (let i = enhancedMessages.length - 1; i >= 0; i--) {
      if (enhancedMessages[i].role === 'user') {
        // Dodaj instrukcje formatowania do treści wiadomości użytkownika
        enhancedMessages[i] = {
          ...enhancedMessages[i],
          content: `${instructions}\n\n${enhancedMessages[i].content}`
        };
        break;
      }
    }
    
    return enhancedMessages;
  }