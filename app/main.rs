use http_body::Body as _;
use hyper::{Client, Request, Method, Body, StatusCode};
use hyper::client::HttpConnector;
use std::env;
use std::process;
use std::thread;
use std::time;

async fn send_to_aliens(client: &Client<HttpConnector>, url: &str, body: String) ->
    Result<(), Box<dyn std::error::Error + Send + Sync>> {

    let req = Request::builder()
        .method(Method::POST)
        .uri(url.to_owned() + "/aliens/send")
        .body(Body::from(body))?;

    match client.request(req).await {
        Ok(mut res) => {
            match res.status() {
                StatusCode::OK => {
                    print!("Server response: ");
                    while let Some(chunk) = res.body_mut().data().await {
                        match chunk {
                            Ok(content) => println!("{:?}", content),
                            Err(why) => println!("error reading body: {:?}", why)
                        }
                    }
                },
                _ => {
                    println!("Unexpected server response:");
                    println!("HTTP code: {}", res.status());
                    print!("Response body: ");
                    while let Some(chunk) = res.body_mut().data().await {
                        match chunk {
                            Ok(content) => println!("{:?}", content),
                            Err(why) => println!("error reading body: {:?}", why)
                        }
                    }
                    process::exit(2);
                }
            }
        },
        Err(err) => {
            println!("Unexpected server response:\n{}", err);
            process::exit(1);
        }
    }

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let args: Vec<String> = env::args().collect();

    let server_url = &args[1];
    let player_key = &args[2];

    println!("ServerUrl: {}; PlayerKey: {}", server_url, player_key);

    let client = Client::new();
    
    send_to_aliens(&client, &server_url, "1101000\n".to_owned()).await?;
    thread::sleep(time::Duration::from_secs(12));
    send_to_aliens(&client, &server_url, "1101000\n".to_owned()).await?;
    thread::sleep(time::Duration::from_secs(6));
    send_to_aliens(&client, &server_url, "1101000\n".to_owned()).await?;

    Ok(())
}
