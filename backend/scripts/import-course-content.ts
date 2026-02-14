/**
 * Script para importar conteúdo do curso Python a partir dos JSONs
 *
 * Uso: bun scripts/import-course-content.ts
 *
 * Este script:
 * 1. Cria a categoria "Programação" (se não existir)
 * 2. Cria o curso "Python Completo"
 * 3. Importa todos os módulos de content/*.json
 * 4. Cria lições e seções com conteúdo
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Container } from '../src/infrastructure/di/Container.ts';
import { CreateCategoryCommand } from '@courses/application/commands/create-category/CreateCategoryCommand.ts';
import { CreateCourseCommand } from '@courses/application/commands/create-course/CreateCourseCommand.ts';
import { CreateModuleCommand } from '@courses/application/commands/create-module/CreateModuleCommand.ts';
import { UpdateModuleCommand } from '@courses/application/commands/update-module/UpdateModuleCommand.ts';
import { AddLessonCommand } from '@courses/application/commands/add-lesson/AddLessonCommand.ts';
import { UpdateLessonCommand } from '@courses/application/commands/update-lesson/UpdateLessonCommand.ts';
import { CreateSectionCommand } from '@courses/application/commands/create-section/CreateSectionCommand.ts';
import { UpdateSectionCommand } from '@courses/application/commands/update-section/UpdateSectionCommand.ts';
import { SectionContentType } from '@courses/domain/value-objects/SectionContentType.ts';
import { LessonType } from '@courses/domain/value-objects/LessonType.ts';
import { Slug } from '@courses/domain/value-objects/Slug.ts';
import { Email } from '@auth/domain/value-objects/Email.ts';
import { CourseId } from '@courses/domain/value-objects/CourseId.ts';
import { LessonId } from '@courses/domain/value-objects/LessonId.ts';
import type { Module } from '@courses/domain/entities/Module.ts';
import type { Lesson } from '@courses/domain/entities/Lesson.ts';
import type { Section } from '@courses/domain/entities/Section.ts';
import type { SectionContent, TextSectionContent, QuizSectionContent, ExerciseSectionContent } from '@courses/domain/entities/Section.ts';

// Tipos para os JSONs de conteúdo
interface ModuleJson {
  module: {
    title: string;
    description: string;
    order: number;
  };
  lessons: LessonJson[];
}

interface LessonJson {
  title: string;
  slug: string;
  description: string;
  type: string;
  order: number;
  duration: number;
  isFree: boolean;
  isPublished: boolean;
  sections: SectionJson[];
}

interface SectionJson {
  title: string;
  description: string;
  contentType: string;
  order: number;
  content: string | Record<string, unknown>;
  estimatedMinutes?: number;
}

// Configuração
const CONTENT_DIR = join(import.meta.dir, '../../content');
const INSTRUCTOR_EMAIL = process.env.INSTRUCTOR_EMAIL || 'ricardo@maroquio.com'; // Email do instrutor padrão

async function main() {
  console.log('='.repeat(60));
  console.log('Importação de Conteúdo do Curso Python');
  console.log('='.repeat(60));

  try {
    // Inicializar Container
    Container.initialize();

    // 1. Verificar/Criar usuário instrutor
    const instructorId = await getOrCreateInstructor();
    console.log(`\n✓ Instrutor: ${instructorId}`);

    // 2. Criar categoria
    const categoryId = await createCategory();
    console.log(`✓ Categoria criada: ${categoryId}`);

    // 3. Criar curso
    const courseId = await createCourse(instructorId, categoryId);
    console.log(`✓ Curso criado: ${courseId}`);

    // 4. Ler e importar módulos
    const jsonFiles = await getContentFiles();
    console.log(`\n📁 Encontrados ${jsonFiles.length} arquivos de módulo\n`);

    for (const file of jsonFiles) {
      await importModule(courseId, file);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Importação concluída com sucesso!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Erro durante importação:', error);
    process.exit(1);
  } finally {
    await Container.shutdown();
  }
}

async function getOrCreateInstructor(): Promise<string> {
  const userRepository = Container.createUserRepository();

  // Tentar encontrar usuário admin por email
  const emailResult = Email.create(INSTRUCTOR_EMAIL);
  if (emailResult.isFailure) {
    throw new Error(`Email inválido: ${INSTRUCTOR_EMAIL}`);
  }

  const admin = await userRepository.findByEmail(emailResult.getValue());

  if (admin) {
    return admin.getId().toValue();
  }

  // Se não existe, criar via RegisterUserHandler
  const registerHandler = Container.createRegisterUserHandler();
  const { RegisterUserCommand } = await import('@auth/application/commands/register-user/RegisterUserCommand.ts');
  const result = await registerHandler.execute(
    new RegisterUserCommand(
      INSTRUCTOR_EMAIL,
      'Admin@123',
      'Professor Admin',
      '' // phone (optional)
    )
  );

  if (result.isFailure) {
    throw new Error(`Falha ao criar instrutor: ${result.getError()}`);
  }

  // Buscar o usuário recém-criado para obter o ID
  const newUser = await userRepository.findByEmail(emailResult.getValue());
  if (!newUser) {
    throw new Error('Falha ao recuperar instrutor recém-criado');
  }

  return newUser.getId().toValue();
}

async function createCategory(): Promise<string> {
  const categoryRepository = Container.createCategoryRepository();

  // Verificar se já existe
  const slugResult = Slug.create('programacao');
  if (slugResult.isFailure) {
    throw new Error('Slug inválido');
  }
  const existing = await categoryRepository.findBySlug(slugResult.getValue());
  if (existing) {
    console.log('  (categoria já existe)');
    return existing.getId().toValue();
  }

  const handler = Container.createCreateCategoryHandler();
  const result = await handler.execute(
    new CreateCategoryCommand('Programação', 'Cursos de programação e desenvolvimento de software')
  );

  if (result.isFailure) {
    throw new Error(`Falha ao criar categoria: ${result.getError()}`);
  }

  return result.getValue().id;
}

async function createCourse(instructorId: string, categoryId: string): Promise<string> {
  const courseRepository = Container.createCourseRepository();

  // Verificar se já existe (usar fromTitle para gerar o mesmo slug que o handler)
  const courseTitle = 'Python Essencial';
  const slugResult = Slug.fromTitle(courseTitle);
  if (slugResult.isFailure) {
    throw new Error('Slug inválido');
  }
  const existing = await courseRepository.findBySlug(slugResult.getValue());
  if (existing) {
    console.log('  (curso já existe)');
    return existing.getId().toValue();
  }

  const handler = Container.createCreateCourseHandler();
  const result = await handler.execute(
    new CreateCourseCommand(
      courseTitle, // title
      instructorId, // instructorId
      'Domine os recursos essenciais da linguagem Python, incluindo fundamentos, estruturas de controle, funções, programação orientada a objetos, tratamento de exceções e programação concorrente.', // description
      undefined, // thumbnailUrl
      undefined, // bannerUrl
      'Aprenda os recursos essenciais da linguagem Python com exercícios práticos e exemplos didáticos.', // shortDescription
      0, // price (gratuito)
      'BRL', // currency
      'beginner', // level
      categoryId, // categoryId
      ['python', 'programação', 'backend', 'iniciante'] // tags
    )
  );

  if (result.isFailure) {
    throw new Error(`Falha ao criar curso: ${result.getError()}`);
  }

  return result.getValue().id;
}

async function getContentFiles(): Promise<string[]> {
  const files = await readdir(CONTENT_DIR);
  return files
    .filter(f => f.startsWith('modulo-') && f.endsWith('.json'))
    .sort((a, b) => {
      // Extrair número do módulo para ordenar corretamente
      const numA = parseInt(a.match(/modulo-(\d+)/)?.[1] || '0');
      const numB = parseInt(b.match(/modulo-(\d+)/)?.[1] || '0');
      return numA - numB;
    })
    .map(f => join(CONTENT_DIR, f));
}

async function importModule(courseId: string, filePath: string): Promise<void> {
  const fileName = filePath.split('/').pop();
  console.log(`📦 Importando: ${fileName}`);

  const content = await readFile(filePath, 'utf-8');
  const data = JSON.parse(content);

  // Extrair módulo e lições (suportar diferentes estruturas JSON)
  // Estrutura 1: { module: { title, description }, lessons: [] }
  // Estrutura 2: { title, description, lessons: [] } (dados do módulo no root)
  // Estrutura 3: { moduleId, title, description, lessons: [] }
  // Estrutura 4: { id, title, description, lessons: [] }
  let moduleTitle: string;
  let moduleDescription: string;
  let lessons: LessonJson[];

  if (data.module) {
    // Estrutura 1: dados do módulo dentro de .module
    moduleTitle = data.module.title;
    moduleDescription = data.module.description || '';
    lessons = data.lessons || data.module.lessons || [];
  } else if (data.title) {
    // Estruturas 2, 3, 4: dados do módulo no root
    moduleTitle = data.title;
    moduleDescription = data.description || '';
    lessons = data.lessons || [];
  } else {
    console.error(`   ❌ Estrutura inválida no arquivo ${fileName}`);
    return;
  }

  if (!moduleTitle) {
    console.error(`   ❌ Título do módulo não encontrado no arquivo ${fileName}`);
    return;
  }

  // Verificar se o módulo já existe (pelo título)
  const moduleRepository = Container.createModuleRepository();
  const courseIdVO = CourseId.create(courseId);
  const existingModules = await moduleRepository.findByCourse(courseIdVO);
  const existingModule = existingModules.find(m => m.getTitle() === moduleTitle);

  let moduleId: string;

  if (existingModule) {
    // Atualizar módulo existente
    const updateHandler = Container.createUpdateModuleHandler();
    const updateResult = await updateHandler.execute(
      new UpdateModuleCommand(
        existingModule.getId().toValue(),
        moduleTitle,
        moduleDescription
      )
    );

    if (updateResult.isFailure) {
      console.error(`   ❌ Falha ao atualizar módulo: ${updateResult.getError()}`);
      return;
    }

    moduleId = existingModule.getId().toValue();
    console.log(`   ✓ Módulo atualizado: ${moduleTitle}`);

    // Importar lições (com update)
    for (const lesson of lessons) {
      await importLesson(moduleId, lesson, existingModule);
    }
  } else {
    // Criar novo módulo
    const createHandler = Container.createCreateModuleHandler();
    const createResult = await createHandler.execute(
      new CreateModuleCommand(
        courseId,
        moduleTitle,
        moduleDescription
      )
    );

    if (createResult.isFailure) {
      console.error(`   ❌ Falha ao criar módulo: ${createResult.getError()}`);
      return;
    }

    moduleId = createResult.getValue().id;
    console.log(`   ✓ Módulo criado: ${moduleTitle}`);

    // Importar lições (sem módulo existente)
    for (const lesson of lessons) {
      await importLesson(moduleId, lesson, null);
    }
  }
}

async function importLesson(moduleId: string, lesson: LessonJson | any, existingModule: Module | null): Promise<void> {
  // Normalizar campos da lição (suportar diferentes estruturas JSON)
  const title = lesson.title;
  const description = lesson.description || lesson.summary || null;
  const duration = lesson.duration || lesson.estimatedMinutes || lesson.estimated_minutes || 0;
  const type = lesson.type || 'text';
  const isFree = lesson.isFree ?? false;
  const isPublished = lesson.isPublished ?? true;
  const sections = lesson.sections || [];

  // Mapear tipo de lição
  const lessonType = mapLessonType(type);

  // Gerar slug se não existir
  const slug = lesson.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  try {
    // Verificar se a lição já existe (pelo slug)
    let existingLesson: Lesson | undefined;
    if (existingModule) {
      const moduleLessons = existingModule.getLessons();
      existingLesson = moduleLessons.find(l => l.getSlug() === slug);
    }

    let lessonId: string;

    if (existingLesson) {
      // Atualizar lição existente
      const updateHandler = Container.createUpdateLessonHandler();
      const updateResult = await updateHandler.execute(
        new UpdateLessonCommand(
          existingLesson.getId().toValue(),
          title,
          description,
          undefined, // videoUrl
          duration
        )
      );

      if (updateResult.isFailure) {
        console.error(`      ❌ Falha ao atualizar lição "${title}": ${updateResult.getError()}`);
        return;
      }

      lessonId = existingLesson.getId().toValue();
      console.log(`      ✓ Lição atualizada: ${title} (${sections.length} seções)`);

      // Importar seções (com update)
      const sectionRepository = Container.createSectionRepository();
      const lessonIdVO = LessonId.create(lessonId);
      const existingSections = await sectionRepository.findByLesson(lessonIdVO);

      for (const section of sections) {
        await importSection(lessonId, section, existingSections);
      }
    } else {
      // Criar nova lição
      const createHandler = Container.createAddLessonHandler();
      const createResult = await createHandler.execute(
        new AddLessonCommand(
          moduleId,
          title,
          slug,
          description,
          undefined, // content
          undefined, // videoUrl
          duration,
          lessonType,
          isFree,
          isPublished
        )
      );

      if (createResult.isFailure) {
        console.error(`      ❌ Falha ao criar lição "${title}": ${createResult.getError()}`);
        return;
      }

      lessonId = createResult.getValue().id;
      console.log(`      ✓ Lição criada: ${title} (${sections.length} seções)`);

      // Importar seções (sem seções existentes)
      for (const section of sections) {
        await importSection(lessonId, section, []);
      }
    }
  } catch (error) {
    console.error(`      ❌ Erro inesperado na lição "${title}":`, error);
  }
}

async function importSection(lessonId: string, section: SectionJson | any, existingSections: Section[]): Promise<void> {
  // Normalizar campos da seção (suportar diferentes estruturas JSON)
  const title = section.title;
  const description = section.description || null;

  // Mapear tipo de conteúdo (contentType ou type)
  const contentTypeStr = section.contentType || section.type || 'text';
  const contentType = mapContentType(contentTypeStr);

  // Preparar conteúdo baseado no tipo
  const content = prepareContent(section, contentTypeStr);

  // Verificar se a seção já existe (pelo título)
  const existingSection = existingSections.find(s => s.getTitle() === title);

  if (existingSection) {
    // Atualizar seção existente
    const updateHandler = Container.createUpdateSectionHandler();
    const updateResult = await updateHandler.execute(
      new UpdateSectionCommand(
        existingSection.getId().toValue(),
        title,
        description,
        contentType,
        content
      )
    );

    if (updateResult.isFailure) {
      console.error(`         ❌ Falha ao atualizar seção "${title}": ${updateResult.getError()}`);
      return;
    }
    // Log silencioso para seções atualizadas (muitas seções por lição)
  } else {
    // Criar nova seção
    const createHandler = Container.createCreateSectionHandler();
    const createResult = await createHandler.execute(
      new CreateSectionCommand(
        lessonId,
        title,
        contentType,
        description,
        content
      )
    );

    if (createResult.isFailure) {
      console.error(`         ❌ Falha ao criar seção "${title}": ${createResult.getError()}`);
      return;
    }
  }
}

function mapLessonType(type: string): LessonType {
  const mapping: Record<string, LessonType> = {
    'text': LessonType.TEXT,
    'video': LessonType.VIDEO,
    'quiz': LessonType.QUIZ,
    'assignment': LessonType.ASSIGNMENT,
  };
  return mapping[type] || LessonType.TEXT;
}

function mapContentType(type: string): SectionContentType {
  const mapping: Record<string, SectionContentType> = {
    'text': SectionContentType.TEXT,
    'video': SectionContentType.VIDEO,
    'quiz': SectionContentType.QUIZ,
    'exercise': SectionContentType.EXERCISE,
  };
  return mapping[type] || SectionContentType.TEXT;
}

function prepareContent(section: SectionJson | any, contentType: string): SectionContent {
  // Normalizar duração estimada (diferentes nomes de campo)
  const estimatedMinutes = section.estimatedMinutes || section.durationMinutes || section.estimated_minutes || 5;

  if (contentType === 'text') {
    // Seção de texto - content é uma string markdown
    const body = typeof section.content === 'string' ? section.content : '';
    const textContent: TextSectionContent = {
      body,
      estimatedMinutes,
    };
    return textContent;
  }

  if (contentType === 'quiz') {
    // Seção de quiz - content pode ser um objeto ou estar no root da section
    if (typeof section.content === 'object' && section.content !== null) {
      return section.content as QuizSectionContent;
    }
    // Quiz data pode estar no root da section
    if (section.questions) {
      return {
        passingScore: section.passingScore || 70,
        questions: section.questions,
      } as QuizSectionContent;
    }
  }

  if (contentType === 'exercise') {
    // Seção de exercício - content pode ser um objeto ou campos no root da section
    if (typeof section.content === 'object' && section.content !== null) {
      return section.content as ExerciseSectionContent;
    }
    // Exercise data pode estar no root da section
    if (section.problem || section.starterCode) {
      return {
        problem: section.problem || '',
        starterCode: section.starterCode || '',
        testCases: section.testCases || [],
        hints: section.hints || [],
        solution: section.solution || '',
      } as ExerciseSectionContent;
    }
  }

  // Fallback
  return null;
}

// Executar
main();
