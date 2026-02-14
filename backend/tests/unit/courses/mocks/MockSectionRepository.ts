import type { ISectionRepository } from '@courses/domain/repositories/ISectionRepository.ts';
import { Section } from '@courses/domain/entities/Section.ts';
import type { SectionId } from '@courses/domain/value-objects/SectionId.ts';
import type { LessonId } from '@courses/domain/value-objects/LessonId.ts';

/**
 * Mock SectionRepository for testing handlers
 * Simulates database operations with in-memory storage
 */
export class MockSectionRepository implements ISectionRepository {
  private sections: Map<string, Section> = new Map();

  async save(section: Section): Promise<void> {
    this.sections.set(section.getId().toValue(), section);
  }

  async findById(id: SectionId): Promise<Section | null> {
    return this.sections.get(id.toValue()) ?? null;
  }

  async findByLesson(lessonId: LessonId): Promise<Section[]> {
    const result: Section[] = [];
    for (const section of this.sections.values()) {
      if (section.getLessonId().equals(lessonId)) {
        result.push(section);
      }
    }
    return result.sort((a, b) => a.getOrder() - b.getOrder());
  }

  async existsByLessonAndOrder(lessonId: LessonId, order: number): Promise<boolean> {
    for (const section of this.sections.values()) {
      if (section.getLessonId().equals(lessonId) && section.getOrder() === order) {
        return true;
      }
    }
    return false;
  }

  async countByLesson(lessonId: LessonId): Promise<number> {
    let count = 0;
    for (const section of this.sections.values()) {
      if (section.getLessonId().equals(lessonId)) {
        count++;
      }
    }
    return count;
  }

  async delete(id: SectionId): Promise<void> {
    this.sections.delete(id.toValue());
  }

  async deleteByLesson(lessonId: LessonId): Promise<void> {
    for (const [key, section] of this.sections.entries()) {
      if (section.getLessonId().equals(lessonId)) {
        this.sections.delete(key);
      }
    }
  }

  async getNextOrder(lessonId: LessonId): Promise<number> {
    let maxOrder = 0;
    for (const section of this.sections.values()) {
      if (section.getLessonId().equals(lessonId)) {
        if (section.getOrder() > maxOrder) {
          maxOrder = section.getOrder();
        }
      }
    }
    return maxOrder + 1;
  }

  // Test helpers
  clear(): void {
    this.sections.clear();
  }

  addSection(section: Section): void {
    this.sections.set(section.getId().toValue(), section);
  }

  getAll(): Section[] {
    return Array.from(this.sections.values());
  }
}
