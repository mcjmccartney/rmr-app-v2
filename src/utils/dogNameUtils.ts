import { Client } from '@/types';

/**
 * Get the correct dog name for a session, handling cases where the client's dog name has been updated.
 * This function checks for exact matches and partial matches (e.g., "Hetty Spaghetti" -> "Hetty").
 * 
 * @param sessionDogName - The dog name stored in the session
 * @param client - The client object with current dog name and other dogs
 * @returns The correct dog name to use
 */
export function getSessionDogName(
  sessionDogName: string | null | undefined,
  client: Client | null | undefined
): string {
  if (!sessionDogName) {
    return client?.dogName || 'Unknown Dog';
  }
  
  if (!client) {
    return sessionDogName;
  }

  // Exact match (case-insensitive)
  if (client.dogName && sessionDogName.toLowerCase() === client.dogName.toLowerCase()) {
    return client.dogName; // Use client's current name (may have been edited)
  }

  // Check if the session dog name starts with the client's current dog name
  // This handles cases like "Hetty Spaghetti" -> "Hetty"
  if (client.dogName && sessionDogName.toLowerCase().startsWith(client.dogName.toLowerCase() + ' ')) {
    return client.dogName; // Use the updated shorter name
  }

  // Check if session dog matches any of the other dogs
  if (client.otherDogs && Array.isArray(client.otherDogs)) {
    // Exact match
    const matchingOtherDog = client.otherDogs.find(
      dog => dog.toLowerCase() === sessionDogName.toLowerCase()
    );
    if (matchingOtherDog) {
      return matchingOtherDog; // Use the current name from otherDogs array
    }

    // Check if session dog name starts with any of the other dogs
    const partialMatchOtherDog = client.otherDogs.find(
      dog => sessionDogName.toLowerCase().startsWith(dog.toLowerCase() + ' ')
    );
    if (partialMatchOtherDog) {
      return partialMatchOtherDog; // Use the updated shorter name
    }
  }

  // Fallback to session's dog name
  return sessionDogName;
}

