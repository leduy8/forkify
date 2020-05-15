import Search from "./models/Search";
import Recipe from "./models/Recipe";
import * as searchView from "./views/searchView";
import * as recipeView from "./views/recipeView";
import { elements, renderLoader, clearLoader } from "./views/base";

/** Global state of the app
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes
 */
const state = {};

/**
 *  SEARCH CONTROLLER
 */
const controlSearch = async () => {
  //1. Get the query from view
  //const query = searchView.getInput();
  const query = "pizza";

  if (query) {
    //2. New Search object and add to state
    state.search = new Search(query);

    //3. Prepare UI for results
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);

    try {
      //4. Search for recipes
      await state.search.getResults();

      //5. Render results on UI
      clearLoader();
      searchView.renderResults(state.search.result);
      //console.log(state.search.result);
    } catch (error) {
      clearLoader();
      alert("Something went wrong with the search...");
    }
  }
};

elements.searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  controlSearch();
});

elements.searchResPages.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-inline");
  if (btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);
  }
});

/**
 *  RECIPE CONTROLLER
 */

const controlRecipe = async () => {
  //1. Get ID from url
  const id = window.location.hash.replace("#", "");
  console.log(id);

  if (id) {
    //2. Prepare UI for changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);

    //Highlight selected search item
    if (state.search) {
      recipeView.highlightSelected(id);
    }

    //3. Create new recipe object
    state.recipe = new Recipe(id);

    try {
      //4. Get recipe data and parse ingredients
      await state.recipe.getRecipe();
      state.recipe.parseIngredients();

      //5. Calculate servings and time
      state.recipe.calcTime();
      state.recipe.calcServings();

      //6. Render recipe
      //console.log(state.recipe);
      clearLoader();
      recipeView.renderRecipe(state.recipe);
    } catch (error) {
      alert("Error processing recipe");
    }
  }
};

// window.addEventListener("hashchange", controlRecipe);
// window.addEventListener("load", controlRecipe);
["hashchange", "load"].forEach((event) =>
  window.addEventListener(event, controlRecipe)
);

//Handling recipe button clicks
elements.recipe.addEventListener("click", (e) => {
  if (e.target.matches(".btn-decrease, .btn-decrease *")) {
    //Decrease button is clicked
    if (state.recipe.servings > 1) {
      state.recipe.updateServings("dec");
      recipeView.updateServingsIngredients(state.recipe);
    }
  } else if (e.target.matches(".btn-increase, .btn-increase *")) {
    //Increase button is clicked
    state.recipe.updateServings("inc");
    recipeView.updateServingsIngredients(state.recipe);
  }
});

//TESTING
window.addEventListener("load", (e) => {
  e.preventDefault();
  controlSearch();
});
