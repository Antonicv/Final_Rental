package dev.renting.delegations;

import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.Endpoint;
import java.io.File;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Endpoint
@AnonymousAllowed
public class ImageEndpoint {

    public List<String> getCarImageFilenames() {
        // Path to the images directory in src/main/resources/META-INF/resources/images/
        File imagesDir = new File("src/main/resources/META-INF/resources/images");
        if (!imagesDir.exists() || !imagesDir.isDirectory()) {
            return List.of();
        }

        // List all .webp files and return their names
        return Arrays.stream(imagesDir.listFiles((dir, name) -> name.endsWith(".webp")))
                .map(File::getName)
                .collect(Collectors.toList());
    }
}