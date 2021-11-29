import * as fs from 'fs/promises';
import mySongsWithoutCharts from './songs-without-charts.js'

const CHARTS_DIRECTORY = './charts';
const CHRISTMAS_DIRECTORY = 'Christmas Music';

async function getSongs(dir) {
    function removeExtensionsFromSongTitles(title, artist) {
        let newTitle = title;
        let newArtist = artist;

        if (newArtist && (newArtist.includes('.pdf') || newArtist.includes('.gp'))) {
            newArtist = newArtist.split('.').slice(0, -1).join('.')
        }

        if (newTitle && newTitle.includes('[')) {
            newTitle = newTitle.split('[').slice(0, -1).join('.').trim()
        }

        if (newTitle && (newTitle.includes('.pdf') || newTitle.includes('.gp'))) {
            newTitle = newTitle.split('.').slice(0, -1).join('.')
        }

        return { artist: newArtist, title: newTitle }
    }

    try {
        let songsList = []
        const fileNames = await fs.readdir(dir)

        for (const fileName of fileNames) {
            if (fileName === '.DS_Store') continue
            let [title, artist] = fileName.split(' - ')

            if (title === CHRISTMAS_DIRECTORY) {
                const christmasDir = `${CHARTS_DIRECTORY}/${CHRISTMAS_DIRECTORY}`
                const christmasSongs = await getSongs(christmasDir)
                songsList = [...songsList, ...christmasSongs]
                continue
            }

            const song = removeExtensionsFromSongTitles(title, artist)

            songsList.push(song)
        }

        return songsList
    } catch (e) {
        console.log(e)
    }
}

function groupByArtist(charts) {
    return charts.reduce((acc, song) => {
        const {artist, title} = song
        const match = acc.get(artist)
        if (match && !match.songs.includes(title)) {
            match.songs.push(title)
        } else {
            acc.set(artist, {songs: [title]});
        }
        return acc;
    }, new Map)

    // creates an Object from the Map so that it can be logged easily
    // console.log(Object.fromEntries(charts));
}

function flattenSongMap(mapping) {
    function replacer(key, value) {
        if (value instanceof Map) {
            return [...value].map(item => {
                const [artistNameKey, {songs}] = item
                return {
                    artist: artistNameKey,
                    songs
                }
            })
        } else {
            return value;
        }
    }

    return JSON.stringify(mapping, replacer, 2);
}

const myCharts = await getSongs(CHARTS_DIRECTORY)

const chartsByArtistMap = groupByArtist(myCharts.concat(mySongsWithoutCharts))
const chartsByArtist = flattenSongMap(chartsByArtistMap)


fs.writeFile('./data.json', chartsByArtist);
