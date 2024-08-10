import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config();

const scrapeLinkedInCompany = async (companyUrl) => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto('https://www.linkedin.com/login');

    await page.type('#username', process.env.LINKEDIN_EMAIL);
    await page.type('#password', process.env.LINKEDIN_PASSWORD);
    
    await page.click('[type="submit"]');
    await page.waitForNavigation();

    await page.goto(companyUrl);
    await page.waitForSelector('.feed-shared-update-v2');

    let previousHeight = 0;

    // Scroll and load all posts
    while (true) {
        try {
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });

            await new Promise(resolve => setTimeout(resolve, 2000));

            const newHeight = await page.evaluate('document.body.scrollHeight');
            console.log("New Height:", newHeight);
            console.log("Previous Height:", previousHeight);

            if (newHeight === previousHeight) {
                break;
            }

            previousHeight = newHeight;

        } catch (error) {
            console.error('Error during scrolling:', error);
            break;
        }
    }

    await new Promise(resolve => setTimeout(resolve, 5000));

    const posts = await page.evaluate(() => {
        const postElements = document.querySelectorAll('.feed-shared-update-v2');
        console.log('Number of posts found:', postElements.length);

        const postData = [];

        postElements.forEach((post, index) => {
            const content = post.querySelector('.feed-shared-text__text, .break-words')?.innerText || 'No content found';
            const reactions = post.querySelector('.social-details-social-counts__reactions-count')?.innerText || 'No reactions found';
            const comments = post.querySelector('.social-details-social-counts__comments')?.innerText || 'No comments found';

            console.log(`Post ${index + 1}:`, {
                content,
                reactions,
                comments
            });

            postData.push({
                content: content.trim(),
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
