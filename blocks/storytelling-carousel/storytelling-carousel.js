import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const rows = [...block.children];

  // Filter out any legacy or non-slide label rows (e.g. single cell without picture)
  const slideRows = rows.filter((row) => {
    if (row.children.length === 1 && !row.querySelector('picture')) {
      return false;
    }
    return true;
  });

  // If there are no slide items yet (empty block), display an author-friendly placeholder
  if (slideRows.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.className = 'storytelling-placeholder';
    placeholder.innerHTML = `
      <div class="storytelling-placeholder-content">
        <p class="storytelling-placeholder-title">Storytelling Carousel</p>
        <p class="storytelling-placeholder-hint">No slides added yet. Select this block and click <strong>+</strong> in the editor toolbar to add a Storytelling Slide.</p>
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

    // Map authored columns:
    // [0] image, [1] imageAlt, [2] category, [3] heading, [4] description
    const slideImgCol = row.children[0];
    const slideAltCol = row.children[1];
    const slideCatCol = row.children[2];
    const slideHeadCol = row.children[3];
    const slideDescCol = row.children[4];

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
