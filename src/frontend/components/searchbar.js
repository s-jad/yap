import '../styles/searchbar.css';

function findMatches(wordToMatch, searchItems) {
    return searchItems.filter((item) => {
        const regex = new RegExp(wordToMatch, 'gi');
        return item.innerText.match(regex);
    });
};

function displayMatches(
  wordToMatch,
  searchField,
  searchItems,
  searchItemClassName
) {
  const matches = findMatches(wordToMatch, searchItems);
  const currentlyDisplayed = Array.from(searchField.querySelectorAll(`.${searchItemClassName}:not(.hidden)`));

  searchItems.forEach((item) => {
    const targetItemText = item.innerText;
    const match = matches.some((match) => match.innerText === targetItemText)

    if (!match && currentlyDisplayed.some((displayedItem) => displayedItem.innerText === targetItemText)) {
      item.classList.add('hidden');
      item.parentNode.classList.add('hidden');
    } else if (match && !currentlyDisplayed.some((hiddenItem) => hiddenItem.innerText === targetItemText)) {
      item.classList.remove('hidden');
      item.parentNode.classList.remove('hidden');
    }
  });
}

function populateSearchField(searchField, searchItemClassName) {
  const hiddenItems = Array.from(searchField.querySelectorAll(`.${searchItemClassName}.hidden`));

  hiddenItems.forEach((item) => {
    item.classList.remove('hidden');
    item.parentNode.classList.remove('hidden');
  });
}

export default function Searchbar(
  subClass, 
  searchField, 
  searchItemClassName,
) {
  const searchbar = document.createElement('input');
  searchbar.className = `searchbar ${subClass} minimized`;
  searchbar.type = 'text';
  
  let searchItems = Array.from(searchField.querySelectorAll(`.${searchItemClassName}`));

  searchbar.addEventListener('update-searchbar', () => {
    searchItems = Array.from(searchField.querySelectorAll(`.${searchItemClassName}`));
  });

  searchbar.addEventListener('change', () => {
    if (searchbar.value === '') {
      populateSearchField(searchField, searchItemClassName);
    } else {
      displayMatches(
        searchbar.value,
        searchField,
        searchItems,
        searchItemClassName,
      );
    }
  });

  searchbar.addEventListener('keyup', () => {
    if (searchbar.value === '') {
      populateSearchField(searchField, searchItemClassName);
    } else {
      displayMatches(
        searchbar.value,
        searchField,
        searchItems,
        searchItemClassName,
      );
    }
  });

  return searchbar;
}
