import { IdGenerator } from './id-generator.util';

describe('IdGenerator', () => {
  describe('generateId', () => {
    it('should generate a unique ID', () => {
      // Act
      const id1 = IdGenerator.generateId();
      const id2 = IdGenerator.generateId();

      // Assert
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs with correct format', () => {
      // Act
      const id = IdGenerator.generateId();

      // Assert
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
      // Should be alphanumeric
      expect(id).toMatch(/^[a-zA-Z0-9_-]+$/);
    });

    it('should generate multiple unique IDs', () => {
      // Arrange
      const ids = new Set<string>();
      const iterations = 1000;

      // Act
      for (let i = 0; i < iterations; i++) {
        ids.add(IdGenerator.generateId());
      }

      // Assert
      expect(ids.size).toBe(iterations);
    });

    it('should generate IDs with consistent length', () => {
      // Act
      const id1 = IdGenerator.generateId();
      const id2 = IdGenerator.generateId();
      const id3 = IdGenerator.generateId();

      // Assert
      expect(id1.length).toBe(id2.length);
      expect(id2.length).toBe(id3.length);
    });

    it('should not generate empty strings', () => {
      // Act
      const id = IdGenerator.generateId();

      // Assert
      expect(id).not.toBe('');
      expect(id.length).toBeGreaterThan(0);
    });
  });
}); 