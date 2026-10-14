import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  // Support both <ul>/<li> and row <div> structures for multi-field slides
  let slideRows = [];
  const ul = block.querySelector(':scope > ul, :scope > div > ul');
  if (ul) {
    slideRows = [...ul.children];
  } else {
    slideRows = [...block.children].filter((row) => {
      if (row.classList.contains('storytelling-placeholder')) {
        return false;
      }
      if (row.children.length === 1 && !row.querySelector('picture, img')) {
        return false;
      }
      return true;
    });
  }

  // If there are no slide items yet (empty block), display an author-friendly placeholder
  if (slideRows.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.className = 'storytelling-placeholder';
    placeholder.innerHTML = `
      <div class="storytelling-placeholder-content">
        <p class="storytelling-placeholder-title">Storytelling Carousel</p>
        <p class="storytelling-placeholder-hint">In the properties panel on the right, under <strong>Slides</strong>, click <strong>+ Add</strong> to add slides.</p>
      </div>
    `;
    block.replaceChildren(placeholder);
    return;
  }

  // 1. Create structural containers
  const carouselContainer = document.createElement('div');
  carouselContainer.className = 'storytelling-container';

  const imagesWrapper = document.createElement('div');
  imagesWrapper.className = 'storytelling-images';

  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'storytelling-content';

  const dotsWrapper = document.createElement('div');
  dotsWrapper.className = 'storytelling-dots';

  // 2. Parse the authored rows
  slideRows.forEach((row, slideIndex) => {
    const isActive = slideIndex === 0 ? 'active' : '';

    // Map authored columns or semantic elements
    let slideImgCol = row.children[0];
    const slideAltCol = row.children[1];
    let slideCatCol = row.children[2];
    let slideHeadCol = row.children[3];
    let slideDescCol = row.children[4];

    // Fallback if rendered as semantic elements inside an item
    if (!slideHeadCol && row.querySelector('h1, h2, h3, h4, h5, h6')) {
      const headingEl = row.querySelector('h1, h2, h3, h4, h5, h6');
      const pictureEl = row.querySelector('picture, img');
      const paragraphs = [...row.querySelectorAll('p')];
      slideImgCol = pictureEl ? pictureEl.parentElement : row.children[0];
      slideHeadCol = headingEl;
      if (paragraphs.length >= 2) {
        [slideCatCol, slideDescCol] = paragraphs;
      } else if (paragraphs.length === 1) {
        [slideDescCol] = paragraphs;
      }
    }

    // Build Image Element
    const imgDiv = document.createElement('div');
    imgDiv.className = `storytelling-img-item ${isActive}`;

    const picture = slideImgCol?.querySelector('picture');
    if (picture) {
      const img = picture.querySelector('img');
      const altText = slideAltCol?.textContent?.trim() || '';
      const optimizedPic = createOptimizedPicture(img.src, altText || img.alt || '', false, [{ width: '750' }]);
      moveInstrumentation(img, optimizedPic.querySelector('img'));
      if (slideImgCol) moveInstrumentation(slideImgCol, optimizedPic);
      imgDiv.append(optimizedPic);
    } else {
      const placeholderImg = document.createElement('div');
      placeholderImg.className = 'storytelling-img-placeholder';
      placeholderImg.textContent = 'Add slide image';
      if (slideImgCol) moveInstrumentation(slideImgCol, placeholderImg);
      imgDiv.append(placeholderImg);
    }
    imagesWrapper.append(imgDiv);

    // Build Text Content Element
    const contentDiv = document.createElement('div');
    contentDiv.className = `storytelling-text-item ${isActive}`;
    moveInstrumentation(row, contentDiv);

    const categoryText = slideCatCol?.textContent?.trim() || 'Category';
    const pCategory = document.createElement('p');
    pCategory.className = 'st-category';
    pCategory.textContent = categoryText;
    if (slideCatCol) moveInstrumentation(slideCatCol, pCategory);

    const headingText = slideHeadCol?.textContent?.trim() || 'Slide Heading';
    const hHeading = document.createElement('h2');
    hHeading.className = 'st-heading';
    hHeading.textContent = headingText;
    if (slideHeadCol) moveInstrumentation(slideHeadCol, hHeading);

    const divDesc = document.createElement('div');
    divDesc.className = 'st-description';
    divDesc.innerHTML = slideDescCol?.innerHTML?.trim() || '<p>Slide description</p>';
    if (slideDescCol) moveInstrumentation(slideDescCol, divDesc);

    contentDiv.append(pCategory, hHeading, divDesc);
    contentWrapper.append(contentDiv);

    // Build Navigation Dot
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = `storytelling-dot ${isActive}`;
    dot.setAttribute('aria-label', `Go to slide ${slideIndex + 1}`);

    const activateSlide = () => {
      carouselContainer.querySelectorAll('.active').forEach((el) => el.classList.remove('active'));
      dot.classList.add('active');
      imgDiv.classList.add('active');
      contentDiv.classList.add('active');
    };

    dot.addEventListener('click', activateSlide);
    imgDiv.addEventListener('click', activateSlide);
    contentDiv.addEventListener('click', activateSlide);

    dotsWrapper.append(dot);
  });

  // 3. Clear raw block and append new interactive structure
  carouselContainer.append(imagesWrapper, dotsWrapper, contentWrapper);
  block.replaceChildren(carouselContainer);
}
