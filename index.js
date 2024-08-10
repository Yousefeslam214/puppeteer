import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

const scrapeLinkedInCompany = async (companyUrl) => {
    const browser = await puppeteer.launch({ headless: false }); // Set headless to false to see the browser
    const page = await browser.newPage();

    // Log into LinkedIn
    await page.goto('https://www.linkedin.com/login');
    await page.type('#username', process.env.LINKEDIN_EMAIL); // Use email from .env file
    await page.type('#password', process.env.LINKEDIN_PASSWORD); // Use password from .env file
    await page.click('[type="submit"]');
    await page.waitForNavigation();

    // Navigate to the company profile
    await page.goto(companyUrl);
    await page.waitForSelector('.feed-shared-update-v2'); // Wait for posts to load

    let previousHeight = 0; // Initialize previousHeight

    // Scroll and load all posts
    while (true) {
        try {
            // Scroll down to load more posts
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });

            // Wait for a short duration to allow content to load
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds

            // Get the new height of the document
            const newHeight = await page.evaluate('document.body.scrollHeight');
            console.log("New Height:", newHeight);
            console.log("Previous Height:", previousHeight);

            if (newHeight === previousHeight) {
                break; // No new posts are loading, exit the loop
            }

            previousHeight = newHeight; // Update previousHeight

        } catch (error) {
            console.error('Error during scrolling:', error);
            break; // Exit the loop if an error occurs
        }
    }

    // Wait for all posts to load
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds

    // Extract posts and details
    const posts = await page.evaluate(() => {
        const postElements = document.querySelectorAll('.feed-shared-update-v2');
        console.log('Number of posts found:', postElements.length);

        const postData = [];

        postElements.forEach((post, index) => {
            const content = post.querySelector('.feed-shared-text__text, .break-words')?.innerText || 'No content found';
            const time = post.querySelector('.feed-shared-actor__sub-description')?.innerText || 'No time found';
            const reactions = post.querySelector('.social-details-social-counts__reactions-count')?.innerText || 'No reactions found';
            const comments = post.querySelector('.social-details-social-counts__comments')?.innerText || 'No comments found';

            console.log(`Post ${index + 1}:`, {
                content,
                time,
                reactions,
                comments
            });

            postData.push({
                content: content.trim(),
                time: time.trim(),
                reactions: reactions.trim(),
                comments: comments.trim(),
            });
        });

        return postData;
    });

    console.log(posts);

    await browser.close();
};

scrapeLinkedInCompany('https://www.linkedin.com/company/microsoft/posts/');
