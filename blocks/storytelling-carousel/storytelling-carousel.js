import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const slideRows = [...block.children].filter((row) => {
    if (row.classList.contains('storytelling-placeholder')) {
      return false;
    }
    return row.children.length > 0;
  });

  // Empty state handling when no slides are added yet
  if (slideRows.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.className = 'storytelling-placeholder';
    placeholder.innerHTML = `
      <div class="storytelling-placeholder-content">
        <p class="storytelling-placeholder-title">Storytelling Carousel</p>
        <p class="storytelling-placeholder-hint">No slides added yet. Open the <strong>Content Tree</strong> (layers icon) or click <strong>+</strong> in the editor to add a <strong>Storytelling Slide</strong>.</p>
      </div>
    `;
    block.replaceChildren(placeholder);
    return;
  }

  // 1. Structural containers matching Figma layout
  const carouselContainer = document.createElement('div');
  carouselContainer.className = 'storytelling-container';

  const navWrapper = document.createElement('div');
  navWrapper.className = 'storytelling-nav';

  const imagesWrapper = document.createElement('div');
  imagesWrapper.className = 'storytelling-images';

  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'storytelling-content';

  // 2. Parse authored slides
  slideRows.forEach((row, slideIndex) => {
    const isActive = slideIndex === 0 ? 'active' : '';

    const cols = [...row.children];
    const imageCol = cols[0];
    const altCol = cols[1];
    const contentCol = cols[2];

    // --- Build Image Element ---
    const imgDiv = document.createElement('div');
    imgDiv.className = `storytelling-img-item ${isActive}`;

    const picture = imageCol?.querySelector('picture');
    if (picture) {
      const img = picture.querySelector('img');
      const altText = altCol?.textContent?.trim() || '';
      const optimizedPic = createOptimizedPicture(img.src, altText || img.alt || '', false, [{ width: '900' }]);
      moveInstrumentation(img, optimizedPic.querySelector('img'));
      if (imageCol) moveInstrumentation(imageCol, optimizedPic);
      imgDiv.append(optimizedPic);
    } else {
      const placeholderImg = document.createElement('div');
      placeholderImg.className = 'storytelling-img-placeholder';
      placeholderImg.textContent = 'Add slide image';
      if (imageCol) moveInstrumentation(imageCol, placeholderImg);
      imgDiv.append(placeholderImg);
    }
    imagesWrapper.append(imgDiv);

    // --- Build Content Element (Figma framed style) ---
    const textDiv = document.createElement('div');
    textDiv.className = `storytelling-text-item ${isActive}`;
    moveInstrumentation(row, textDiv);

    const frame = document.createElement('div');
    frame.className = 'storytelling-content-frame';

    const cornerBottomLeft = document.createElement('span');
    cornerBottomLeft.className = 'frame-corner frame-bottom-left';
    const cornerBottomRight = document.createElement('span');
    cornerBottomRight.className = 'frame-corner frame-bottom-right';
    frame.append(cornerBottomLeft, cornerBottomRight);

    const body = document.createElement('div');
    body.className = 'storytelling-body';

    if (contentCol) {
      moveInstrumentation(contentCol, body);
      const elements = [...contentCol.children];
      if (elements.length > 0) {
        let foundHeading = false;
        elements.forEach((el) => {
          if (/^H[1-6]$/.test(el.tagName)) {
            el.classList.add('st-heading');
            foundHeading = true;
          } else if (!foundHeading && el.tagName === 'P') {
            el.classList.add('st-category');
          } else if (foundHeading && el.tagName === 'P') {
            el.classList.add('st-description');
          }
          body.append(el);
        });
      } else {
        body.innerHTML = contentCol.innerHTML || '<p class="st-category">ENGINEERING</p><h2 class="st-heading">Slide Heading</h2><p class="st-description">Slide description</p>';
      }
    } else if (cols.length >= 4) {
      const pCat = document.createElement('p');
      pCat.className = 'st-category';
      pCat.textContent = cols[2]?.textContent?.trim() || 'ENGINEERING';
      if (cols[2]) moveInstrumentation(cols[2], pCat);

      const hHead = document.createElement('h2');
      hHead.className = 'st-heading';
      hHead.textContent = cols[3]?.textContent?.trim() || 'Slide Heading';
      if (cols[3]) moveInstrumentation(cols[3], hHead);

      const pDesc = document.createElement('div');
      pDesc.className = 'st-description';
      pDesc.innerHTML = cols[4]?.innerHTML?.trim() || '<p>Slide description</p>';
      if (cols[4]) moveInstrumentation(cols[4], pDesc);

      body.append(pCat, hHead, pDesc);
    }

    // Add Figma badge icon below description
    const badge = document.createElement('div');
    badge.className = 'st-badge';
    badge.setAttribute('aria-hidden', 'true');
    badge.innerHTML = '<div class="st-badge-inner"><span>V</span></div>';
    body.append(badge);

    frame.append(body);
    textDiv.append(frame);
    contentWrapper.append(textDiv);

    // --- Build Indicator Dot ---
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = `storytelling-dot ${isActive}`;
    dot.setAttribute('aria-label', `Go to slide ${slideIndex + 1}`);

    const activateSlide = () => {
      carouselContainer.querySelectorAll('.active').forEach((el) => el.classList.remove('active'));
      dot.classList.add('active');
      imgDiv.classList.add('active');
      textDiv.classList.add('active');
    };

    dot.addEventListener('click', activateSlide);
    imgDiv.addEventListener('click', activateSlide);
    textDiv.addEventListener('click', activateSlide);

    navWrapper.append(dot);
  });

  // 3. Assemble: Nav -> Images -> Content (matching Figma)
  carouselContainer.append(navWrapper, imagesWrapper, contentWrapper);
  block.replaceChildren(carouselContainer);
}
