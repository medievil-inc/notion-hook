import core from "@actions/core"
import github from "@actions/github"
import { Client } from "@notionhq/client"

async function searchPage(notion, commit) {
    const regex = "(?=(?:.*?[A-Za-z]))(?=(?:.*?[0-9]))[A-Za-z0-9]{32}";
    const query = commit.message.match(regex)?.[0];

    const response = await notion.search({
        query: query,
        filter: {
            property: "object",
            value: "page"
        }
    });

    return response.results?.[0];
}

async function createCommentByCommit(notion, payload, commit) {
    let page = await searchPage(notion, commit);

    if (page == null || typeof page == "undefined") { 
        return
    }

    notion.comments.create(
        {
            parent: {
                page_id: page.id
            },
            rich_text: [
                {
                    text: {
                        content: `💬 Commit: `
                    },
                    annotations: { 
                        color: "gray"
                    }
                },
                {
                    text: { 
                        content: `${commit.message.replace(/(\r\n|\n|\r)/gm, " ")}\n`
                    }
                },
                {
                    text: {
                        content: `👀 Branch: `
                    },
                    annotations: { 
                        color: "gray"
                    }
                },
                {
                    text: { 
                        content: `${payload.ref}\n`
                    },
                    annotations: { 
                        color: "purple"
                    }
                },
                {
                    text: {
                        content: `🐣 Author: `
                    },
                    annotations: { 
                        color: "gray"
                    }
                },
                {
                    text: { 
                        content: `${commit.author.name}\n`
                    },
                    annotations: {
                        code: true, 
                        color: "yellow"
                    }
                },
                {
                    text: {
                        content: `📫 URL: `
                    },
                    annotations: { 
                        color: "gray"
                    }
                },
                {
                    text: { 
                        content: `${commit.url}`,
                        link: { 
                            url: commit.url
                        }
                    },
                    annotations: { 
                        color: "blue"
                    }
                }
            ]
        }
    )
    .then(result => core.notice(JSON.stringify(result, null, 4)))
    .catch(error => core.setFailed(error.message));
}

async function createCommentByPr(notion, payload, pullRequest) { 

}

(async () => {
    try {
        const notion = new Client({
            auth: core.getInput(`notion_secret`)
        });

        const payload = github.context.payload
        const pullRequest = payload.pull_request
        const commits = payload.commits

        console.log("------------------------------------------");
        console.log(JSON.stringify(payload, null, 4));
        console.log("------------------------------------------");

        if (typeof pullRequest != "undefined" && pullRequest != null) { 
            createCommentByPr(notion, payload, pullRequest);
        } else if (typeof commits != "undefined" && commits != null && commits.length != null && commits.length > 0) { 
            commits.forEach((commit) => {
                createCommentByCommit(notion, payload, commit);
            });
        } else { 
            createCommentByCommit(notion, payload, payload.head_commit);
        }
    } catch (error) {
        core.setFailed(error.message);
    }
})();


