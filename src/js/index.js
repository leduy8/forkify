import Search from "./models/Search";
import Recipe from "./models/Recipe";
import List from "./models/List";
import Likes from "./models/Likes";
import * as searchView from "./views/searchView";
import * as recipeView from "./views/recipeView";
import * as listView from "./views/listView";
import * as likesView from "./views/likesView";
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
  const query = searchView.getInput();

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
      clearLoader();
      recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
    } catch (error) {
      console.log(error);
      alert("Error processing recipe");
    }
  }
};

// window.addEventListener("hashchange", controlRecipe);
// window.addEventListener("load", controlRecipe);
["hashchange", "load"].forEach((event) =>
  window.addEventListener(event, controlRecipe)
);
window.addEventListener("load", recipeView.clearRecipe);

/**
 *  LIST CONTROLLER
 */
const controlList = () => {
  //Create a new list IF there is none yet
  if (!state.list) {
    state.list = new List();
  }

  //Add each ingredient to the list and UI
  state.recipe.ingredients.forEach((el) => {
    console.log(el);
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  });
};

//Handle delete and update list item events
elements.shopping.addEventListener("click", (e) => {
  const id = e.target.closest(".shopping__item").dataset.itemid;

  //Handle the delete button
  if (e.target.matches(".shopping__delete, .shopping__delete *")) {
    //Delete from state
    state.list.deleteItem(id);

    //Delete from UI
    listView.deleteItem(id);
  } else if (e.target.matches(".shopping__count-value")) {
    //Handle count update
    const val = parseFloat(e.target.value, 10);
    if (val >= 0) {
      state.list.updateCount(id, val);
    }
  }
});

/**
 *  LIKE CONTROLLER
 */
const controlLike = () => {
  if (!state.likes) {
    state.likes = new Likes();
  }
  const currentID = state.recipe.id;

  if (!state.likes.isLiked(currentID)) {
    //User has not yet liked current recipe
    //Add like to the state
    const newLike = state.likes.addLike(
      currentID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );

    //Toggle the like button
    likesView.toggleLikeBtn(true);

    //Add like to UI list
    likesView.renderLike(newLike);
  } else {
    //User has liked current recipe
    //Remove like from the state
    state.likes.deleteLike(currentID);

    //Toggle the like button
    likesView.toggleLikeBtn(false);

    //Remove like to UI list
    likesView.deleteLike(currentID);
  }

  likesView.toggleLikeMenu(state.likes.getNumLikes());
};

//Restore liked recipe when page load
window.addEventListener("load", () => {
  state.likes = new Likes();

  //Restore likes
  state.likes.readStorage();

  //Toggle like menu button
  likesView.toggleLikeMenu(state.likes.getNumLikes());

  //Render existing likes
  state.likes.likes.forEach((like) => {
    likesView.renderLike(like);
  });
});

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
  } else if (e.target.matches(".recipe__btn--add, .recipe__btn--add *")) {
    //Add ingredients to shopping list
    controlList();
  } else if (e.target.matches(".recipe__love, .recipe__love *")) {
    //Add like to likes list
    controlLike();
  }
});

//TESTING
// window.addEventListener("load", (e) => {
//   e.preventDefault();
//   controlSearch();
// });
