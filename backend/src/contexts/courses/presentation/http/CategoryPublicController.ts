import { handleRoute } from '@shared/presentation/http/routeHandler.ts';
import { ListCategoriesQuery } from '../../application/queries/list-categories/ListCategoriesQuery.ts';
import { ListCategoriesHandler } from '../../application/queries/list-categories/ListCategoriesHandler.ts';

/**
 * CategoryPublicController
 * Handles public HTTP endpoints for categories
 */
export class CategoryPublicController {
  constructor(private listCategoriesHandler: ListCategoriesHandler) {}

  public routes(app: any) {
    // List categories (public - for course form dropdown)
    app.get(
      '/v1/courses/categories',
      handleRoute({
        handler: async () => this.listCategoriesHandler.execute(new ListCategoriesQuery()),
      }),
      {
        detail: {
          tags: ['Public Courses'],
          summary: 'List all categories',
          description: 'Lists all categories ordered by name (public endpoint for course dropdowns)',
        },
      }
    );

    return app;
  }
}
