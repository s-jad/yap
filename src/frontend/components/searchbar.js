import '../styles/searchbar.css';

function findMatches(wordToMatch, searchItems) {
    return searchItems.filter((element) => {
        const regex = new RegExp(wordToMatch, 'gi');
        return element.title.match(regex);
    });
};

function displayMatches(
  wordToMatch,
  searchField,
  searchItems,
  searchItemClassName
) {
  console.log("displayMatches::params => ", wordToMatch, searchField, searchItemClassName);
  const matches = findMatches(wordToMatch, searchItems);
  
  const currentlyDisplayed = Array.from(searchField.querySelectorAll(`${searchItemClassName}:not(.hidden)`));

  searchItems.forEach((item) => {
    const targetItemText = item.innerText;
    const match = matches.some((match) => match.innerText === targetItemText)

    if (!match && currentlyDisplayed.some((displayedItem) => displayedItem.innerText === targetItemText)) {
        item.parentNode.classList.add('hidden');
    } else if (match && !currentlyDisplayed.some((hiddenItem) => hiddenItem.innerText === targetItemText)) {
        item.parentNode.classList.remove('hidden');
    }
  });
}

function populateSearchField(searchField, searchItemClassName) {
  const hiddenItems = Array.from(searchField.querySelectorAll(`${searchItemClassName}.hidden`));

  hiddenItems.forEach((item) => {
    item.classList.remove('hidden');
  });
}

export default function Searchbar(
  subClass, 
  searchField, 
  searchItemClassName,
) {
  const searchbar = document.createElement('input');
  searchbar.className = `searchbar ${subClass}`;
  searchbar.type = 'text';
  
  let searchItems = Array.from(searchField.querySelectorAll(`${searchItemClassName}`));

  searchbar.addEventListener('update-searchbar', () => {
    searchItems = Array.from(searchField.querySelectorAll(`${searchItemClassName}`));
    console.log("updated Searchbar::searchItems => ", searchItems);
  })
  console.log("Searchbar::searchItems => ", searchItems);

  searchbar.addEventListener('change', () => {
    if (searchbar.value === '') {
       populateSearchField(searchField, searchItemClassName);
    } else {
      displayMatches(
        searchbar.value,
        searchField,
        searchItems,
        searchItemClassName
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
        searchItemClassName
      );
    }
  });

  return searchbar;
}
