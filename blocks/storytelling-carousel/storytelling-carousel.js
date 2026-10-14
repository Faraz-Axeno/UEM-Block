export default function decorate(block) {
  // 1. Create structural containers
  const carouselContainer = document.createElement('div');
  carouselContainer.className = 'storytelling-container';

  const imagesWrapper = document.createElement('div');
  imagesWrapper.className = 'storytelling-images';

  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'storytelling-content';

  const dotsWrapper = document.createElement('div');
  dotsWrapper.className = 'storytelling-dots';

  // 2. Parse the authored rows from the Universal Editor
  const rows = [...block.children];
  let slideIndex = 0;

  rows.forEach((row) => {
    // Skip the parent label row if it doesn't contain an image
    if (row.children.length === 1 && !row.querySelector('picture')) {
      return;
    }

    // Map the authored columns based on your JSON model fields
    const slideImgCol = row.children[0];
    const slideAltCol = row.children[1];
    const slideCatCol = row.children[2];
    const slideHeadCol = row.children[3];
    const slideDescCol = row.children[4];

    const isActive = slideIndex === 0 ? 'active' : '';

    // Build Image Element
    const imgDiv = document.createElement('div');
    imgDiv.className = `storytelling-img-item ${isActive}`;
    const picture = slideImgCol.querySelector('picture');
    if (picture) {
      const img = picture.querySelector('img');
      const altText = slideAltCol?.textContent?.trim();
      if (img && altText) {
        img.alt = altText;
      }
      imgDiv.append(picture);
    }
    imagesWrapper.append(imgDiv);

    // Build Text Content Element
    const contentDiv = document.createElement('div');
    contentDiv.className = `storytelling-text-item ${isActive}`;

    const category = slideCatCol?.textContent || '';
    const heading = slideHeadCol?.textContent || '';
    const description = slideDescCol?.innerHTML || '';

    contentDiv.innerHTML = `
      <p class="st-category">${category}</p>
      <h2 class="st-heading">${heading}</h2>
      <div class="st-description">${description}</div>
    `;
    contentWrapper.append(contentDiv);

    // Build the Navigation Dot
    const dot = document.createElement('button');
    dot.className = `storytelling-dot ${isActive}`;
    dot.setAttribute('aria-label', `Go to slide ${slideIndex + 1}`);

    // Add Click Event to synchronize Images, Text, and Dots
    dot.addEventListener('click', () => {
      // Remove active class from all elements
      block.querySelectorAll('.active').forEach((el) => el.classList.remove('active'));

      // Add active class to the selected dot, image, and text
      dot.classList.add('active');
      imgDiv.classList.add('active');
      contentDiv.classList.add('active');
    });

    dotsWrapper.append(dot);
    slideIndex += 1;
  });

  // 3. Clear the original raw block and append the new interactive structure
  block.textContent = '';
  carouselContainer.append(imagesWrapper, dotsWrapper, contentWrapper);
  block.append(carouselContainer);
}
