import jsonfile from "jsonfile";
import moment from "moment";
import simpleGit from "simple-git";
import random from "random";
import { execSync } from 'child_process';

const path = "./data.json";

// Function to remove future-dated commits
const removeFutureCommits = () => {
    try {
        const now = moment().format();
        const output = execSync('git log --pretty=format:"%h %cI"').toString();
        const commits = output.split('\n').map(line => {
            const [hash, date] = line.split(' ');
            return { hash, date };
        });

        const futureCommits = commits.filter(commit => moment(commit.date).isAfter(now));
        
        if (futureCommits.length > 0) {
            console.log('Found future-dated commits, removing them...');
            futureCommits.forEach(commit => {
                try {
                    console.log(`Removing future commit: ${commit.hash} - ${commit.date}`);
                    execSync(`git rebase --onto ${commit.hash}^ ${commit.hash}`);
                } catch (error) {
                    console.error(`Error removing commit ${commit.hash}:`, error.message);
                }
            });
            console.log('Future-dated commits removed.');
        }
    } catch (error) {
        console.error('Error checking for future commits:', error.message);
    }
};

const getRandomDate = () => {
    // Get a random date within the current year
    const currentYear = moment().year();
    const startOfYear = moment().year(currentYear).startOf('year');
    const now = moment();
    
    // Calculate days between start of year and now
    const daysInYear = now.diff(startOfYear, 'days');
    const randomDays = Math.floor(Math.random() * daysInYear);
    const randomHours = Math.floor(Math.random() * 24);
    const randomMinutes = Math.floor(Math.random() * 60);
    
    // Create date in the past
    return startOfYear
        .add(randomDays, 'days')
        .add(randomHours, 'hours')
        .add(randomMinutes, 'minutes')
        .format();
};

const makeCommits = (n) => {
    if (n === 0) {
        console.log('All commits completed!');
        return simpleGit().push();
    }
    
    const date = getRandomDate();
    const data = { date };
    
    // Double-check that the date is not in the future
    if (moment(date).isAfter(moment())) {
        console.log(`Skipping future commit: ${date}`);
        return makeCommits(n); // Retry with a new date
    }
    
    console.log(`Commit ${n}: ${date}`);
    
    jsonfile.writeFile(path, data, (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return makeCommits(n); // Retry on error
        }
        
        simpleGit()
            .add([path])
            .commit(date, { '--date': date })
            .then(() => makeCommits(n - 1))
            .catch(err => {
                console.error('Error committing:', err);
                makeCommits(n); // Retry on error
            });
    });
};

// First, remove any existing future-dated commits
console.log('Checking for and removing any future-dated commits...');
removeFutureCommits();

// Then start making new commits
console.log('Starting to create commits...');
makeCommits(100);
